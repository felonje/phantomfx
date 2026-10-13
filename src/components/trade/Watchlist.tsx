"use client";

import { price } from "@/lib/client/format";
import type { Tick } from "@/lib/client/usePrices";
import type { InstrumentInfo } from "./types";

export function Watchlist({
  instruments,
  ticks,
  selected,
  onSelect,
}: {
  instruments: InstrumentInfo[];
  ticks: Record<string, Tick>;
  selected: string;
  onSelect: (s: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-ink-700 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
        <span>Symbol</span>
        <span className="w-20 text-right">Bid</span>
        <span className="w-20 text-right">Ask</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {instruments.map((i) => {
          const t = ticks[i.symbol];
          const spread = t ? (t.ask - t.bid) / i.pipSize : null;
          return (
            <button
              key={i.symbol}
              onClick={() => onSelect(i.symbol)}
              className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-ink-800 px-3 py-2 text-left hover:bg-ink-800 ${selected === i.symbol ? "bg-ink-800" : ""}`}
            >
              <span>
                <span className="block text-sm font-semibold text-white">{i.symbol}</span>
                <span className="block text-[11px] text-slate-500">
                  {t ? (
                    <>
                      <span className={t.changePct >= 0 ? "text-up" : "text-down"}>
                        {t.changePct >= 0 ? "+" : ""}
                        {t.changePct.toFixed(2)}%
                      </span>{" "}
                      · spr {spread?.toFixed(1)}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </span>
              <span className="w-20 text-right font-mono text-sm text-down">{price(t?.bid, i.digits)}</span>
              <span className="w-20 text-right font-mono text-sm text-up">{price(t?.ask, i.digits)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
