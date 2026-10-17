"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { price } from "@/lib/client/format";
import { usePrices } from "@/lib/client/usePrices";
import { IconBriefcase, IconChart, IconList, IconSwap } from "../icons";
import { AccountBar } from "./AccountBar";
import { OrderTicket } from "./OrderTicket";
import { PositionsPanel } from "./PositionsPanel";
import { PriceChart } from "./PriceChart";
import { Watchlist } from "./Watchlist";
import type { AccountState, AccountSummary, InstrumentInfo } from "./types";

type MobileView = "markets" | "chart" | "trade" | "positions";

export function TradeTerminal() {
  const feed = usePrices();
  const [instruments, setInstruments] = useState<InstrumentInfo[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [state, setState] = useState<AccountState | null>(null);
  const [symbol, setSymbol] = useState("EURUSD");
  const [view, setView] = useState<MobileView>("chart");
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  useEffect(() => {
    api<{ instruments: InstrumentInfo[] }>("/api/prices").then((d) => setInstruments(d.instruments));
    api<{ accounts: AccountSummary[] }>("/api/accounts").then((d) => {
      setAccounts(d.accounts);
      const saved = typeof window !== "undefined" ? localStorage.getItem("pfx_account") : null;
      const pick = d.accounts.find((a) => a.id === saved) ?? d.accounts.find((a) => a.type === "DEMO") ?? d.accounts[0];
      if (pick) setActiveId(pick.id);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!activeId) return;
    try {
      setState(await api<AccountState>(`/api/accounts/${activeId}`));
    } catch {
      /* transient */
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    localStorage.setItem("pfx_account", activeId);
    const first = setTimeout(refresh, 0);
    const t = setInterval(refresh, 1500);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [activeId, refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (msg?: string) => {
    if (msg) setToast({ msg });
    void refresh();
  };

  const resetDemo = async () => {
    if (!confirm("Reset demo account? All positions and orders will be cleared.")) return;
    await api(`/api/accounts/${activeId}/reset`, { method: "POST" });
    notify("Demo account reset");
  };

  const instrument = instruments.find((i) => i.symbol === symbol) ?? instruments[0];
  const tick = instrument ? feed.ticks[instrument.symbol] : undefined;
  const active = accounts.find((a) => a.id === activeId);
  const openCount = (state?.positions.length ?? 0) + (state?.orders.length ?? 0);
  const disabled = !feed.marketOpen
    ? "The FX market is closed (opens Sunday 22:00 UTC)"
    : active?.type === "LIVE" && (state?.metrics.balance ?? 0) <= 0 && (state?.positions.length ?? 0) === 0
      ? "Your live account has no funds. Deposit from the Wallet to start trading."
      : null;

  const show = (v: MobileView) => (view === v ? "flex" : "hidden");
  const mobileTabs: { key: MobileView; label: string; icon: typeof IconChart; badge?: number }[] = [
    { key: "markets", label: "Markets", icon: IconList },
    { key: "chart", label: "Chart", icon: IconChart },
    { key: "trade", label: "Trade", icon: IconSwap },
    { key: "positions", label: "Positions", icon: IconBriefcase, badge: openCount },
  ];

  return (
    <div className="flex h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom))] flex-col lg:h-[calc(100vh-3rem)]">
      <AccountBar
        accounts={accounts}
        activeId={activeId}
        metrics={state?.metrics}
        onSwitch={setActiveId}
        onResetDemo={resetDemo}
        feed={feed}
      />

      {instrument && (
        <div className="flex items-center gap-3 border-b border-ink-700 bg-ink-900 px-3 py-2 lg:hidden">
          <select
            className="input w-auto py-1.5 pr-8 font-semibold"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            aria-label="Instrument"
          >
            {instruments.map((i) => (
              <option key={i.symbol}>{i.symbol}</option>
            ))}
          </select>
          <div className="ml-auto flex gap-2 font-mono text-sm">
            <button onClick={() => setView("trade")} className="rounded-md bg-down/15 px-2.5 py-1 text-down ring-1 ring-inset ring-down/30">
              {price(tick?.bid, instrument.digits)}
            </button>
            <button onClick={() => setView("trade")} className="rounded-md bg-up/15 px-2.5 py-1 text-up ring-1 ring-inset ring-up/30">
              {price(tick?.ask, instrument.digits)}
            </button>
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_1fr_320px]">
        <aside className={`${show("markets")} min-h-0 flex-col border-ink-700 bg-ink-900 lg:flex lg:border-r`}>
          <Watchlist
            instruments={instruments}
            ticks={feed.ticks}
            selected={symbol}
            onSelect={(s) => {
              setSymbol(s);
              setView("chart");
            }}
          />
        </aside>
        <section className={`${view === "chart" || view === "positions" ? "flex" : "hidden"} min-h-0 flex-col lg:flex`}>
          <div className={`${show("chart")} min-h-[260px] flex-[3] flex-col border-ink-700 bg-ink-900 lg:flex lg:border-b`}>
            {instrument && <PriceChart symbol={instrument.symbol} digits={instrument.digits} tick={tick} />}
          </div>
          <div className={`${show("positions")} min-h-[200px] flex-[2] flex-col bg-ink-900 lg:flex`}>
            <PositionsPanel
              positions={state?.positions ?? []}
              orders={state?.orders ?? []}
              onChange={notify}
              onError={(msg) => setToast({ msg, error: true })}
            />
          </div>
        </section>
        <aside className={`${show("trade")} min-h-0 flex-col overflow-y-auto border-ink-700 bg-ink-900 lg:flex lg:border-l`}>
          {instrument && activeId && (
            <OrderTicket
              accountId={activeId}
              leverage={state?.account.leverage ?? active?.leverage ?? 100}
              instrument={instrument}
              tick={tick}
              disabled={disabled}
              onPlaced={notify}
            />
          )}
        </aside>
      </div>

      <div className="grid grid-cols-4 border-t border-ink-700 bg-ink-950 lg:hidden">
        {mobileTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`relative flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition ${view === t.key ? "text-white" : "text-slate-500"}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {!!t.badge && <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">{t.badge}</span>}
            {view === t.key && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand-500" />}
          </button>
        ))}
      </div>

      {toast && <div className={`toast ${toast.error ? "bg-down" : "bg-ink-700"}`}>{toast.msg}</div>}
    </div>
  );
}
