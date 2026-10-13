import { prisma } from "@/lib/db";
import { STOP_OUT_LEVEL } from "@/lib/instruments";
import { shouldTriggerPending, stopHit, type OrderType, type Side } from "@/lib/trading/math";
import { getInstrument } from "./instrumentCache";
import { withLock } from "./lock";
import { marketOpen, priceFeed } from "./prices";
import { closePositionLocked, getAccountState, openPosition } from "./trading";

let running = false;

/** Runs on every price update: fills pending orders, executes SL/TP and enforces stop-out. */
export async function processTick() {
  if (!marketOpen() || priceFeed.isStale()) return;
  const quotes = priceFeed.quotes();

  const pending = await prisma.order.findMany({ where: { status: "PENDING" } });
  for (const o of pending) {
    const q = quotes[o.symbol];
    if (!q || o.price == null) continue;
    if (!shouldTriggerPending({ side: o.side as Side, type: o.type as OrderType, price: o.price }, q)) continue;
    await withLock(o.accountId, async () => {
      const fresh = await prisma.order.findUnique({ where: { id: o.id } });
      if (fresh?.status !== "PENDING") return;
      const inst = await getInstrument(o.symbol);
      try {
        if (!inst?.enabled) throw new Error(`${o.symbol} is disabled`);
        await openPosition(o.accountId, inst, o.side as Side, o.volume, o.stopLoss, o.takeProfit, quotes, o.id);
      } catch (err) {
        await prisma.order.update({ where: { id: o.id }, data: { status: "REJECTED", reason: (err as Error).message } });
      }
    });
  }

  const open = await prisma.position.findMany({ where: { status: "OPEN" } });
  const accounts = new Set<string>();
  for (const p of open) {
    accounts.add(p.accountId);
    const q = quotes[p.symbol];
    if (!q) continue;
    const hit = stopHit({ side: p.side as Side, stopLoss: p.stopLoss, takeProfit: p.takeProfit }, q);
    if (!hit) continue;
    await withLock(p.accountId, () => closePositionLocked(p.id, hit, quotes)).catch(() => undefined);
  }

  for (const accountId of accounts) {
    await withLock(accountId, async () => {
      for (let i = 0; i < 100; i++) {
        const state = await getAccountState(accountId);
        if (state.metrics.marginLevel === null || state.metrics.marginLevel > STOP_OUT_LEVEL) return;
        const worst = [...state.positions].sort((a, b) => a.profit - b.profit)[0];
        if (!worst) return;
        console.warn(`[engine] Stop-out account ${accountId} at margin level ${state.metrics.marginLevel}%`);
        await closePositionLocked(worst.id, "STOP_OUT", quotes);
      }
    });
  }
}

export function startEngine() {
  const g = globalThis as unknown as { __engineStarted?: boolean };
  if (g.__engineStarted) return;
  g.__engineStarted = true;
  priceFeed.on("ticks", () => {
    if (running) return;
    running = true;
    processTick()
      .catch((err) => console.error("[engine] tick failed", err))
      .finally(() => (running = false));
  });
}
