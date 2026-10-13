"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { dateTime, digitsFor, pnlClass, price, signedUsd, usd } from "@/lib/client/format";
import type { AccountSummary } from "@/components/trade/types";

interface ClosedPosition {
  id: string;
  symbol: string;
  side: string;
  volume: number;
  openPrice: number;
  closePrice: number;
  closeReason: string;
  profit: number;
  commission: number;
  openedAt: string;
  closedAt: string;
}
interface Order {
  id: string;
  symbol: string;
  side: string;
  type: string;
  volume: number;
  price: number | null;
  status: string;
  reason: string | null;
  updatedAt: string;
}
interface Tx {
  id: string;
  type: string;
  amount: number;
  status: string;
  note: string | null;
  method: string | null;
  createdAt: string;
}

export default function HistoryPage() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [accountId, setAccountId] = useState("");
  const [tab, setTab] = useState<"trades" | "orders" | "ledger">("trades");
  const [data, setData] = useState<{ positions: ClosedPosition[]; orders: Order[]; transactions: Tx[] } | null>(null);

  useEffect(() => {
    api<{ accounts: AccountSummary[] }>("/api/accounts").then((d) => {
      setAccounts(d.accounts);
      const saved = localStorage.getItem("pfx_account");
      setAccountId(d.accounts.find((a) => a.id === saved)?.id ?? d.accounts[0]?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (accountId) api<typeof data>(`/api/accounts/${accountId}/history`).then(setData);
  }, [accountId]);

  const trades = data?.positions ?? [];
  const net = trades.reduce((s, p) => s + p.profit, 0);
  const wins = trades.filter((p) => p.profit > 0).length;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">History</h1>
        <select className="input w-auto" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.type} #{a.login}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4"><div className="text-xs uppercase text-slate-500">Closed trades</div><div className="mt-1 font-mono text-xl text-white">{trades.length}</div></div>
        <div className="card p-4"><div className="text-xs uppercase text-slate-500">Win rate</div><div className="mt-1 font-mono text-xl text-white">{trades.length ? `${((wins / trades.length) * 100).toFixed(0)}%` : "—"}</div></div>
        <div className="card p-4"><div className="text-xs uppercase text-slate-500">Net profit</div><div className={`mt-1 font-mono text-xl ${pnlClass(net)}`}>{signedUsd(net)}</div></div>
      </div>
      <div className="card overflow-hidden">
        <div className="flex border-b border-ink-700 px-2">
          {(["trades", "orders", "ledger"] as const).map((t) => (
            <button key={t} className={`tab capitalize ${tab === t ? "tab-active" : ""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          {tab === "trades" && (
            <table className="table">
              <thead><tr><th>Symbol</th><th>Side</th><th>Lots</th><th>Open</th><th>Close</th><th>Reason</th><th>Opened</th><th>Closed</th><th className="text-right">Profit</th></tr></thead>
              <tbody>
                {trades.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-slate-500">No closed trades</td></tr>}
                {trades.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold text-white">{p.symbol}</td>
                    <td className={p.side === "BUY" ? "text-up" : "text-down"}>{p.side}</td>
                    <td className="font-mono">{p.volume.toFixed(2)}</td>
                    <td className="font-mono">{price(p.openPrice, digitsFor(p.symbol))}</td>
                    <td className="font-mono">{price(p.closePrice, digitsFor(p.symbol))}</td>
                    <td className="text-xs">{p.closeReason}</td>
                    <td className="text-xs text-slate-400">{dateTime(p.openedAt)}</td>
                    <td className="text-xs text-slate-400">{dateTime(p.closedAt)}</td>
                    <td className={`text-right font-mono ${pnlClass(p.profit)}`}>{signedUsd(p.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "orders" && (
            <table className="table">
              <thead><tr><th>Time</th><th>Symbol</th><th>Type</th><th>Lots</th><th>Price</th><th>Status</th><th>Info</th></tr></thead>
              <tbody>
                {data?.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="text-xs text-slate-400">{dateTime(o.updatedAt)}</td>
                    <td className="font-semibold text-white">{o.symbol}</td>
                    <td className={o.side === "BUY" ? "text-up" : "text-down"}>{o.side} {o.type}</td>
                    <td className="font-mono">{o.volume.toFixed(2)}</td>
                    <td className="font-mono">{price(o.price, digitsFor(o.symbol))}</td>
                    <td className="text-xs">{o.status}</td>
                    <td className="text-xs text-slate-400">{o.reason ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "ledger" && (
            <table className="table">
              <thead><tr><th>Time</th><th>Type</th><th>Status</th><th>Details</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {data?.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="text-xs text-slate-400">{dateTime(t.createdAt)}</td>
                    <td>{t.type}</td>
                    <td className="text-xs">{t.status}</td>
                    <td className="text-xs text-slate-400">{t.note ?? t.method ?? ""}</td>
                    <td className={`text-right font-mono ${t.amount >= 0 ? "text-up" : "text-down"}`}>{usd(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
