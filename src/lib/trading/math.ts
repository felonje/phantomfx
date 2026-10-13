export type Side = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "STOP";

export interface BidAsk {
  bid: number;
  ask: number;
}

export type QuoteMap = Record<string, BidAsk & { time?: number }>;

export interface InstrumentSpec {
  symbol: string;
  base: string;
  quote: string;
  digits: number;
  pipSize: number;
  contractSize: number;
}

export const roundTo = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export const round2 = (n: number) => roundTo(n, 2);

export const midOf = (q: BidAsk) => (q.bid + q.ask) / 2;

export function quoteFromMid(mid: number, spreadPips: number, pipSize: number, digits: number): BidAsk {
  const half = (spreadPips * pipSize) / 2;
  return { bid: roundTo(mid - half, digits), ask: roundTo(mid + half, digits) };
}

/** Value of 1 unit of `ccy` expressed in USD, derived from available quotes. */
export function rateToUSD(ccy: string, quotes: QuoteMap): number | null {
  if (ccy === "USD") return 1;
  const direct = quotes[`${ccy}USD`];
  if (direct) return midOf(direct);
  const inverse = quotes[`USD${ccy}`];
  if (inverse) return 1 / midOf(inverse);
  return null;
}

export function pnlInQuote(side: Side, volume: number, contractSize: number, open: number, close: number) {
  return (close - open) * (side === "BUY" ? 1 : -1) * volume * contractSize;
}

export function pnlUSD(
  inst: InstrumentSpec,
  side: Side,
  volume: number,
  open: number,
  close: number,
  quotes: QuoteMap,
): number {
  const rate = rateToUSD(inst.quote, quotes);
  if (rate === null) throw new Error(`No conversion rate for ${inst.quote}`);
  return pnlInQuote(side, volume, inst.contractSize, open, close) * rate;
}

export function marginUSD(inst: InstrumentSpec, volume: number, leverage: number, quotes: QuoteMap): number {
  const rate = rateToUSD(inst.base, quotes);
  if (rate === null) throw new Error(`No conversion rate for ${inst.base}`);
  return (volume * inst.contractSize * rate) / leverage;
}

export const openPriceFor = (side: Side, q: BidAsk) => (side === "BUY" ? q.ask : q.bid);
export const closePriceFor = (side: Side, q: BidAsk) => (side === "BUY" ? q.bid : q.ask);

export function shouldTriggerPending(
  order: { side: Side; type: OrderType; price: number },
  q: BidAsk,
): boolean {
  if (order.side === "BUY") {
    return order.type === "LIMIT" ? q.ask <= order.price : q.ask >= order.price;
  }
  return order.type === "LIMIT" ? q.bid >= order.price : q.bid <= order.price;
}

export function stopHit(
  pos: { side: Side; stopLoss: number | null; takeProfit: number | null },
  q: BidAsk,
): "SL" | "TP" | null {
  const px = closePriceFor(pos.side, q);
  if (pos.side === "BUY") {
    if (pos.stopLoss != null && px <= pos.stopLoss) return "SL";
    if (pos.takeProfit != null && px >= pos.takeProfit) return "TP";
  } else {
    if (pos.stopLoss != null && px >= pos.stopLoss) return "SL";
    if (pos.takeProfit != null && px <= pos.takeProfit) return "TP";
  }
  return null;
}

/** `ref` is the price the position would open at (or the pending order price). */
export function validateStops(side: Side, ref: number, sl: number | null, tp: number | null): string | null {
  if (side === "BUY") {
    if (sl != null && sl >= ref) return "Stop loss must be below the entry price for a BUY";
    if (tp != null && tp <= ref) return "Take profit must be above the entry price for a BUY";
  } else {
    if (sl != null && sl <= ref) return "Stop loss must be above the entry price for a SELL";
    if (tp != null && tp >= ref) return "Take profit must be below the entry price for a SELL";
  }
  return null;
}

/** For modifying an open position: stops are checked against the current closing price. */
export function validateStopsForOpen(side: Side, q: BidAsk, sl: number | null, tp: number | null): string | null {
  const px = closePriceFor(side, q);
  if (side === "BUY") {
    if (sl != null && sl >= px) return "Stop loss must be below the current bid";
    if (tp != null && tp <= px) return "Take profit must be above the current bid";
  } else {
    if (sl != null && sl <= px) return "Stop loss must be above the current ask";
    if (tp != null && tp >= px) return "Take profit must be below the current ask";
  }
  return null;
}

export function validatePendingPrice(side: Side, type: OrderType, price: number, q: BidAsk): string | null {
  if (side === "BUY" && type === "LIMIT" && price >= q.ask) return "Buy limit price must be below the current ask";
  if (side === "BUY" && type === "STOP" && price <= q.ask) return "Buy stop price must be above the current ask";
  if (side === "SELL" && type === "LIMIT" && price <= q.bid) return "Sell limit price must be above the current bid";
  if (side === "SELL" && type === "STOP" && price >= q.bid) return "Sell stop price must be below the current bid";
  return null;
}

export function isValidLot(volume: number, min: number, max: number, step = 0.01): boolean {
  if (!Number.isFinite(volume) || volume < min - 1e-9 || volume > max + 1e-9) return false;
  const steps = volume / step;
  return Math.abs(steps - Math.round(steps)) < 1e-6;
}

export interface AccountMetrics {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number | null;
  floatingPnl: number;
}

export function accountMetrics(balance: number, positions: { margin: number; profit: number }[]): AccountMetrics {
  const floatingPnl = positions.reduce((s, p) => s + p.profit, 0);
  const margin = positions.reduce((s, p) => s + p.margin, 0);
  const equity = balance + floatingPnl;
  return {
    balance: round2(balance),
    equity: round2(equity),
    margin: round2(margin),
    freeMargin: round2(equity - margin),
    marginLevel: margin > 0 ? round2((equity / margin) * 100) : null,
    floatingPnl: round2(floatingPnl),
  };
}

/** Spot FX trades Sunday 22:00 UTC to Friday 22:00 UTC. */
export function isFxMarketOpen(now: Date = new Date()): boolean {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) return false;
  if (day === 5 && hour >= 22) return false;
  if (day === 0 && hour < 22) return false;
  return true;
}
