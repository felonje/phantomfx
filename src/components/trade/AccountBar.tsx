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
  const stat = (label: string, value: React.ReactNode, cls = "text-white") => (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`font-mono text-sm ${cls}`}>{value}</div>
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink-700 bg-ink-900 px-4 py-2">
      <div className="flex rounded-md bg-ink-950 p-0.5">
        {accounts.map((a) => (
          <button
            key={a.id}
            onClick={() => onSwitch(a.id)}
            className={`rounded px-3 py-1 text-xs font-semibold ${a.id === activeId ? (a.type === "LIVE" ? "bg-up text-white" : "bg-brand-500 text-white") : "text-slate-400"}`}
          >
            {a.type} #{a.login}
          </button>
        ))}
      </div>
      {metrics && (
        <>
          {stat("Balance", usd(metrics.balance))}
          {stat("Equity", usd(metrics.equity))}
          {stat("Floating P/L", usd(metrics.floatingPnl), pnlClass(metrics.floatingPnl))}
          {stat("Margin", usd(metrics.margin))}
          {stat("Free margin", usd(metrics.freeMargin))}
          {stat("Margin level", level == null ? "—" : `${level.toFixed(0)}%`, level != null && level < 100 ? "text-down" : "text-white")}
        </>
      )}
      <div className="ml-auto flex items-center gap-3 text-xs">
        {active?.type === "DEMO" && (
          <button onClick={onResetDemo} className="text-slate-400 hover:text-white">Reset demo</button>
        )}
        {active?.type === "LIVE" && (
          <Link href="/wallet" className="btn-primary px-3 py-1 text-xs">Deposit</Link>
        )}
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className={`h-2 w-2 rounded-full ${feed.connected ? (feed.marketOpen ? "bg-up" : "bg-yellow-400") : "bg-down"}`} />
          {feed.connected ? (feed.marketOpen ? `${feed.mode === "simulated" ? "Simulated" : "Live"} prices` : "Market closed") : "Connecting…"}
        </span>
      </div>
    </div>
  );
}
