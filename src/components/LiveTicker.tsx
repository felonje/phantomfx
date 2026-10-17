"use client";

import { digitsFor, price } from "@/lib/client/format";
import { usePrices } from "@/lib/client/usePrices";

export function LiveTicker() {
  const { ticks } = usePrices();
  const list = Object.values(ticks);
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-700/80 bg-ink-800 sm:grid-cols-3 lg:grid-cols-5">
      {list.length === 0 && <div className="col-span-full bg-ink-900 p-4 text-center text-sm text-slate-500">Connecting to price feed…</div>}
      {list.slice(0, 10).map((t) => (
        <div key={t.symbol} className="bg-ink-900 p-3 transition hover:bg-ink-850 sm:p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">{t.symbol}</span>
            <span className={`rounded px-1.5 py-0.5 ${t.changePct >= 0 ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
              {t.changePct >= 0 ? "+" : ""}
              {t.changePct.toFixed(2)}%
            </span>
          </div>
          <div className="mt-2 font-mono text-lg text-white">{price(t.mid, digitsFor(t.symbol))}</div>
        </div>
      ))}
    </div>
  );
}
