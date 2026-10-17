"use client";

import { digitsFor, price } from "@/lib/client/format";
import { usePrices } from "@/lib/client/usePrices";

const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"];

export function HeroQuotes() {
  const { ticks, connected, marketOpen } = usePrices();
  return (
    <div className="card relative mx-auto w-full max-w-md overflow-hidden shadow-glow">
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? (marketOpen ? "bg-up" : "bg-yellow-400") : "bg-slate-500"}`} />
          {connected ? (marketOpen ? "Live" : "Market closed") : "Connecting…"}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500">
        <span>Pair</span>
        <span className="w-20 text-right">Sell</span>
        <span className="w-20 text-right">Buy</span>
      </div>
      {PAIRS.map((s) => {
        const t = ticks[s];
        const d = digitsFor(s);
        return (
          <div key={s} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-t border-ink-800 px-4 py-2.5">
            <div>
              <div className="text-sm font-semibold text-white">{s}</div>
              <div className={`text-[11px] ${t && t.changePct < 0 ? "text-down" : "text-up"}`}>
                {t ? `${t.changePct >= 0 ? "+" : ""}${t.changePct.toFixed(2)}%` : "—"}
              </div>
            </div>
            <span className="w-20 rounded-md bg-down/10 py-1 text-center font-mono text-sm text-down">{price(t?.bid, d)}</span>
            <span className="w-20 rounded-md bg-up/10 py-1 text-center font-mono text-sm text-up">{price(t?.ask, d)}</span>
          </div>
        );
      })}
    </div>
  );
}
