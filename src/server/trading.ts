import type { Position } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import {
  accountMetrics,
  closePriceFor,
  isValidLot,
  marginUSD,
  openPriceFor,
  pnlUSD,
  round2,
  roundTo,
  validatePendingPrice,
  validateStops,
  validateStopsForOpen,
  type OrderType,
  type QuoteMap,
  type Side,
} from "@/lib/trading/math";
import { getInstrument, getInstruments, type Instrument } from "./instrumentCache";
import { withLock } from "./lock";
import { marketOpen, priceFeed } from "./prices";

export class TradeError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

function liveQuotes(): QuoteMap {
  if (priceFeed.isStale()) throw new TradeError("Price feed unavailable, trading is paused");
  return priceFeed.quotes();
}

function quoteFor(symbol: string, quotes: QuoteMap) {
  const q = quotes[symbol];
  if (!q) throw new TradeError(`No price available for ${symbol}`);
  return q;
}

function assertTradable(inst: Instrument | null, symbol: string): Instrument {
  if (!inst || !inst.enabled) throw new TradeError(`${symbol} is not available for trading`);
  if (!marketOpen()) throw new TradeError("The FX market is closed");
  return inst;
}

export async function positionsWithPnl(positions: Position[], quotes: QuoteMap) {
  const insts = await getInstruments();
  return positions.map((p) => {
    const inst = insts.get(p.symbol);
    const q = quotes[p.symbol];
    if (!inst || !q) return { ...p, currentPrice: null as number | null, profit: 0 };
    const currentPrice = closePriceFor(p.side as Side, q);
    const profit = round2(pnlUSD(inst, p.side as Side, p.volume, p.openPrice, currentPrice, quotes));
    return { ...p, currentPrice, profit };
  });
}

export async function getAccountState(accountId: string) {
  const quotes = priceFeed.quotes();
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  const [open, orders] = await Promise.all([
    prisma.position.findMany({ where: { accountId, status: "OPEN" }, orderBy: { openedAt: "desc" } }),
    prisma.order.findMany({ where: { accountId, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
  ]);
  const positions = await positionsWithPnl(open, quotes);
  return { account, positions, orders, metrics: accountMetrics(account.balance, positions) };
}

export interface OrderInput {
  symbol: string;
  side: Side;
  type: OrderType;
  volume: number;
  price?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
}

export async function placeOrder(accountId: string, input: OrderInput) {
  const inst = assertTradable(await getInstrument(input.symbol), input.symbol);
  if (!isValidLot(input.volume, inst.minLot, inst.maxLot)) {
    throw new TradeError(`Volume must be between ${inst.minLot} and ${inst.maxLot} lots in steps of 0.01`);
  }
  const quotes = liveQuotes();
  const q = quoteFor(inst.symbol, quotes);
  const sl = input.stopLoss ? roundTo(input.stopLoss, inst.digits) : null;
  const tp = input.takeProfit ? roundTo(input.takeProfit, inst.digits) : null;

  if (input.type === "MARKET") {
    return withLock(accountId, async () => {
      const position = await openPosition(accountId, inst, input.side, input.volume, sl, tp, quotes);
      return { kind: "position" as const, position };
    });
  }

  if (!input.price || input.price <= 0) throw new TradeError("A price is required for pending orders");
  const price = roundTo(input.price, inst.digits);
  const err = validatePendingPrice(input.side, input.type, price, q) ?? validateStops(input.side, price, sl, tp);
  if (err) throw new TradeError(err);
  const order = await prisma.order.create({
    data: {
      accountId,
      symbol: inst.symbol,
      side: input.side,
      type: input.type,
      volume: input.volume,
      price,
      stopLoss: sl,
      takeProfit: tp,
      status: "PENDING",
    },
  });
  return { kind: "order" as const, order };
}

/** Must be called while holding the account lock. */
export async function openPosition(
  accountId: string,
  inst: Instrument,
  side: Side,
  volume: number,
  sl: number | null,
  tp: number | null,
  quotes: QuoteMap,
  pendingOrderId?: string,
) {
  const q = quoteFor(inst.symbol, quotes);
  const price = openPriceFor(side, q);
  const stopErr = validateStops(side, price, sl, tp);
  if (stopErr) throw new TradeError(stopErr);

  const state = await getAccountState(accountId);
  const margin = round2(marginUSD(inst, volume, state.account.leverage, quotes));
  const commission = round2(inst.commissionPerLot * volume);
  if (state.metrics.freeMargin < margin + commission) {
    throw new TradeError(
      `Not enough free margin: required $${(margin + commission).toFixed(2)}, available $${state.metrics.freeMargin.toFixed(2)}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const position = await tx.position.create({
      data: { accountId, symbol: inst.symbol, side, volume, openPrice: price, stopLoss: sl, takeProfit: tp, margin, commission },
    });
    if (commission > 0) {
      await tx.account.update({ where: { id: accountId }, data: { balance: { decrement: commission } } });
      await tx.transaction.create({
        data: { accountId, type: "COMMISSION", amount: -commission, positionId: position.id, note: `Commission ${volume} lots ${inst.symbol}` },
      });
    }
    if (pendingOrderId) {
      await tx.order.update({ where: { id: pendingOrderId }, data: { status: "FILLED", positionId: position.id, reason: `Filled @ ${price}` } });
    } else {
      await tx.order.create({
        data: { accountId, symbol: inst.symbol, side, type: "MARKET", volume, price, stopLoss: sl, takeProfit: tp, status: "FILLED", positionId: position.id },
      });
    }
    return position;
  });
}

export type CloseReason = "MANUAL" | "SL" | "TP" | "STOP_OUT" | "ADMIN";

/** Must be called while holding the account lock. */
export async function closePositionLocked(positionId: string, reason: CloseReason, quotes: QuoteMap) {
  const pos = await prisma.position.findUnique({ where: { id: positionId } });
  if (!pos || pos.status !== "OPEN") throw new TradeError("Position is not open");
  const inst = await getInstrument(pos.symbol);
  if (!inst) throw new TradeError("Unknown instrument");
  const q = quoteFor(pos.symbol, quotes);
  const side = pos.side as Side;
  const closePrice = closePriceFor(side, q);
  const profit = round2(pnlUSD(inst, side, pos.volume, pos.openPrice, closePrice, quotes));

  const closedAt = new Date();
  return prisma.$transaction(async (tx) => {
    const updated = await tx.position.updateMany({
      where: { id: pos.id, status: "OPEN" },
      data: { status: "CLOSED", closePrice, closeReason: reason, profit, closedAt },
    });
    if (updated.count === 0) throw new TradeError("Position is not open");
    const account = await tx.account.update({ where: { id: pos.accountId }, data: { balance: { increment: profit } } });
    await tx.transaction.create({
      data: {
        accountId: pos.accountId,
        type: "TRADE",
        amount: profit,
        positionId: pos.id,
        note: `Close ${pos.side} ${pos.volume} ${pos.symbol} @ ${closePrice} (${reason})`,
      },
    });
    // Negative balance protection: clients can never lose more than they deposited.
    const stillOpen = await tx.position.count({ where: { accountId: pos.accountId, status: "OPEN" } });
    if (account.balance < 0 && stillOpen === 0) {
      await tx.account.update({ where: { id: pos.accountId }, data: { balance: 0 } });
      await tx.transaction.create({
        data: { accountId: pos.accountId, type: "ADJUSTMENT", amount: round2(-account.balance), note: "Negative balance protection" },
      });
    }
    return { ...pos, status: "CLOSED", closePrice, closeReason: reason, profit, closedAt };
  });
}

export async function closePosition(positionId: string, accountId: string, reason: CloseReason) {
  if (!marketOpen()) throw new TradeError("The FX market is closed");
  const quotes = liveQuotes();
  return withLock(accountId, () => closePositionLocked(positionId, reason, quotes));
}

export async function modifyPosition(positionId: string, accountId: string, sl: number | null, tp: number | null) {
  return withLock(accountId, async () => {
    const pos = await prisma.position.findFirst({ where: { id: positionId, accountId, status: "OPEN" } });
    if (!pos) throw new TradeError("Position is not open");
    const inst = await getInstrument(pos.symbol);
    if (!inst) throw new TradeError("Unknown instrument");
    const q = quoteFor(pos.symbol, liveQuotes());
    const nsl = sl ? roundTo(sl, inst.digits) : null;
    const ntp = tp ? roundTo(tp, inst.digits) : null;
    const err = validateStopsForOpen(pos.side as Side, q, nsl, ntp);
    if (err) throw new TradeError(err);
    return prisma.position.update({ where: { id: pos.id }, data: { stopLoss: nsl, takeProfit: ntp } });
  });
}

export async function cancelOrder(orderId: string, accountId: string) {
  return withLock(accountId, async () => {
    const res = await prisma.order.updateMany({
      where: { id: orderId, accountId, status: "PENDING" },
      data: { status: "CANCELLED", reason: "Cancelled by client" },
    });
    if (res.count === 0) throw new TradeError("Order is not pending");
  });
}
