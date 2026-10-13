"use client";

import { digitsFor, price } from "@/lib/client/format";
import { usePrices } from "@/lib/client/usePrices";

export function LiveTicker() {
  const { ticks } = usePrices();
  const list = Object.values(ticks);
  return (
    <div className="card grid grid-cols-2 divide-ink-700 overflow-hidden sm:grid-cols-5">
      {list.length === 0 && <div className="col-span-full p-4 text-center text-sm text-slate-500">Connecting to price feed…</div>}
      {list.slice(0, 10).map((t) => (
        <div key={t.symbol} className="border-b border-r border-ink-800 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">{t.symbol}</span>
            <span className={t.changePct >= 0 ? "text-up" : "text-down"}>
              {t.changePct >= 0 ? "+" : ""}
              {t.changePct.toFixed(2)}%
            </span>
          </div>
          <div className="mt-1 font-mono text-lg text-white">{price(t.mid, digitsFor(t.symbol))}</div>
        </div>
      ))}
    </div>
  );
}
