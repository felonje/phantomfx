"use client";

import Link from "next/link";
import { pnlClass, usd } from "@/lib/client/format";
import type { AccountSummary, Metrics } from "./types";

export function AccountBar({
  accounts,
  activeId,
  metrics,
  onSwitch,
  onResetDemo,
  feed,
}: {
  accounts: AccountSummary[];
  activeId: string;
  metrics?: Metrics;
  onSwitch: (id: string) => void;
  onResetDemo: () => void;
  feed: { mode: string; marketOpen: boolean; connected: boolean };
}) {
  const active = accounts.find((a) => a.id === activeId);
  const level = metrics?.marginLevel;
  const stat = (label: string, value: React.ReactNode, cls = "text-white", extra = "") => (
    <div className={`shrink-0 ${extra}`}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-mono text-sm tabular-nums ${cls}`}>{value}</div>
    </div>
  );
  const status = (
    <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-400">
      <span className="relative flex h-2 w-2">
        {feed.connected && feed.marketOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${feed.connected ? (feed.marketOpen ? "bg-up" : "bg-yellow-400") : "bg-down"}`} />
      </span>
      {feed.connected ? (feed.marketOpen ? `${feed.mode === "simulated" ? "Simulated" : "Live"} prices` : "Market closed") : "Connecting…"}
    </span>
  );
  return (
    <div className="border-b border-ink-700 bg-ink-900">
      <div className="flex items-center gap-x-6 gap-y-2 px-3 py-2 lg:px-4">
        <div className="flex shrink-0 rounded-lg bg-ink-950 p-0.5 ring-1 ring-inset ring-ink-700/60">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => onSwitch(a.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${a.id === activeId ? (a.type === "LIVE" ? "bg-up text-white" : "bg-brand-500 text-white") : "text-slate-400 hover:text-slate-200"}`}
            >
              {a.type} <span className="hidden opacity-80 sm:inline">#{a.login}</span>
            </button>
          ))}
        </div>
        {metrics && (
          <div className="no-scrollbar hidden min-w-0 flex-1 items-center gap-6 overflow-x-auto lg:flex">
            {stat("Balance", usd(metrics.balance))}
            {stat("Equity", usd(metrics.equity))}
            {stat("Floating P/L", usd(metrics.floatingPnl), pnlClass(metrics.floatingPnl))}
            {stat("Margin", usd(metrics.margin))}
            {stat("Free margin", usd(metrics.freeMargin))}
            {stat("Margin level", level == null ? "—" : `${level.toFixed(0)}%`, level != null && level < 100 ? "text-down" : "text-white")}
          </div>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-3 text-xs">
          {active?.type === "DEMO" && (
            <button onClick={onResetDemo} className="text-slate-400 transition hover:text-white">Reset demo</button>
          )}
          {active?.type === "LIVE" && (
            <Link href="/wallet" className="btn-primary px-3 py-1 text-xs">Deposit</Link>
          )}
          {status}
        </div>
      </div>
      {metrics && (
        <div className="no-scrollbar flex gap-5 overflow-x-auto border-t border-ink-800 px-3 py-2 lg:hidden">
          {stat("Equity", usd(metrics.equity))}
          {stat("P/L", usd(metrics.floatingPnl), pnlClass(metrics.floatingPnl))}
          {stat("Free margin", usd(metrics.freeMargin))}
          {stat("Balance", usd(metrics.balance))}
          {stat("Margin", usd(metrics.margin))}
          {stat("Level", level == null ? "—" : `${level.toFixed(0)}%`, level != null && level < 100 ? "text-down" : "text-white")}
        </div>
      )}
    </div>
  );
}
