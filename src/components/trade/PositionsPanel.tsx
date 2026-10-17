"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";
import { dateTime, digitsFor, pnlClass, price, signedUsd } from "@/lib/client/format";
import type { OrderRow, PositionRow } from "./types";

export function PositionsPanel({
  positions,
  orders,
  onChange,
  onError,
}: {
  positions: PositionRow[];
  orders: OrderRow[];
  onChange: (msg?: string) => void;
  onError: (msg: string) => void;
}) {
  const [tab, setTab] = useState<"positions" | "orders">("positions");
  const [editing, setEditing] = useState<string | null>(null);
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      onChange(msg);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const closeAll = () =>
    run(async () => {
      for (const p of positions) await api(`/api/positions/${p.id}/close`, { method: "POST" });
    }, "All positions closed");

  const startEdit = (p: PositionRow) => {
    setEditing(p.id);
    setSl(p.stopLoss?.toString() ?? "");
    setTp(p.takeProfit?.toString() ?? "");
  };
  const saveEdit = (p: PositionRow) =>
    run(
      () =>
        api(`/api/positions/${p.id}`, {
          method: "PATCH",
          body: { stopLoss: sl ? Number(sl) : null, takeProfit: tp ? Number(tp) : null },
        }).then(() => setEditing(null)),
      "Position modified",
    );
  const closePosition = (p: PositionRow) =>
    run(() => api(`/api/positions/${p.id}/close`, { method: "POST" }), `${p.symbol} position closed`);
  const cancelOrder = (o: OrderRow) => run(() => api(`/api/orders/${o.id}`, { method: "DELETE" }), "Order cancelled");

  const totalPnl = positions.reduce((s, p) => s + p.profit, 0);
  const slInput = <input className="input w-24 px-2 py-1 font-mono text-xs" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="S/L" inputMode="decimal" />;
  const tpInput = <input className="input w-24 px-2 py-1 font-mono text-xs" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="T/P" inputMode="decimal" />;
  const empty = (text: string) => <div className="py-10 text-center text-sm text-slate-500">{text}</div>;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex items-center border-b border-ink-700 px-2">
        <button className={`tab ${tab === "positions" ? "tab-active" : ""}`} onClick={() => setTab("positions")}>
          Positions ({positions.length})
        </button>
        <button className={`tab ${tab === "orders" ? "tab-active" : ""}`} onClick={() => setTab("orders")}>
          Pending ({orders.length})
        </button>
        {tab === "positions" && positions.length > 0 && (
          <span className={`ml-auto px-2 font-mono text-xs ${pnlClass(totalPnl)}`}>{signedUsd(totalPnl)}</span>
        )}
        {tab === "positions" && positions.length > 1 && (
          <button className="px-2 text-xs text-slate-400 hover:text-white" onClick={closeAll}>
            Close all
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "positions" ? (
          <>
            <div className="divide-y divide-ink-800 lg:hidden">
              {positions.length === 0 && empty("No open positions")}
              {positions.map((p) => {
                const d = digitsFor(p.symbol);
                const isEditing = editing === p.id;
                return (
                  <div key={p.id} className="space-y-2 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{p.symbol}</span>
                        <span className={`badge ${p.side === "BUY" ? "bg-up/15 text-up" : "bg-down/15 text-down"}`}>
                          {p.side} {p.volume.toFixed(2)}
                        </span>
                      </div>
                      <span className={`font-mono text-sm font-semibold ${pnlClass(p.profit)}`}>{signedUsd(p.profit)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs text-slate-400">
                      <span>
                        {price(p.openPrice, d)} → <span className="text-slate-200">{price(p.currentPrice, d)}</span>
                      </span>
                      <span>
                        SL {price(p.stopLoss, d)} · TP {price(p.takeProfit, d)}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        {slInput}
                        {tpInput}
                        <button className="ml-auto text-xs font-semibold text-brand-400" onClick={() => saveEdit(p)}>Save</button>
                        <button className="text-xs text-slate-400" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={() => startEdit(p)}>Modify</button>
                        <button className="btn flex-1 bg-ink-700 py-1.5 text-xs text-white hover:bg-ink-600" onClick={() => closePosition(p)}>
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <table className="table hidden lg:table">
              <thead className="sticky top-0">
                <tr>
                  <th>Symbol</th><th>Side</th><th>Lots</th><th>Open</th><th>Current</th><th>S/L</th><th>T/P</th><th>Margin</th><th>Opened</th><th className="text-right">Profit</th><th />
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 && (
                  <tr><td colSpan={11} className="py-6 text-center text-slate-500">No open positions</td></tr>
                )}
                {positions.map((p) => {
                  const d = digitsFor(p.symbol);
                  const isEditing = editing === p.id;
                  return (
                    <tr key={p.id}>
                      <td className="font-semibold text-white">{p.symbol}</td>
                      <td className={p.side === "BUY" ? "text-up" : "text-down"}>{p.side}</td>
                      <td className="font-mono">{p.volume.toFixed(2)}</td>
                      <td className="font-mono">{price(p.openPrice, d)}</td>
                      <td className="font-mono">{price(p.currentPrice, d)}</td>
                      {isEditing ? (
                        <>
                          <td>{slInput}</td>
                          <td>{tpInput}</td>
                        </>
                      ) : (
                        <>
                          <td className="font-mono">{price(p.stopLoss, d)}</td>
                          <td className="font-mono">{price(p.takeProfit, d)}</td>
                        </>
                      )}
                      <td className="font-mono">${p.margin.toFixed(2)}</td>
                      <td className="text-xs text-slate-400">{dateTime(p.openedAt)}</td>
                      <td className={`text-right font-mono font-semibold ${pnlClass(p.profit)}`}>{signedUsd(p.profit)}</td>
                      <td className="space-x-2 text-right">
                        {isEditing ? (
                          <>
                            <button className="text-xs text-brand-400" onClick={() => saveEdit(p)}>Save</button>
                            <button className="text-xs text-slate-400" onClick={() => setEditing(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="text-xs text-slate-400 hover:text-white" onClick={() => startEdit(p)}>Modify</button>
                            <button className="rounded-md bg-ink-700 px-2 py-1 text-xs text-white hover:bg-ink-600" onClick={() => closePosition(p)}>
                              Close
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div className="divide-y divide-ink-800 lg:hidden">
              {orders.length === 0 && empty("No pending orders")}
              {orders.map((o) => {
                const d = digitsFor(o.symbol);
                return (
                  <div key={o.id} className="flex items-center gap-3 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{o.symbol}</span>
                        <span className={`badge ${o.side === "BUY" ? "bg-up/15 text-up" : "bg-down/15 text-down"}`}>
                          {o.side} {o.type} {o.volume.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-xs text-slate-400">
                        @ {price(o.price, d)} · SL {price(o.stopLoss, d)} · TP {price(o.takeProfit, d)}
                      </div>
                    </div>
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => cancelOrder(o)}>Cancel</button>
                  </div>
                );
              })}
            </div>
            <table className="table hidden lg:table">
              <thead className="sticky top-0">
                <tr><th>Symbol</th><th>Type</th><th>Lots</th><th>Price</th><th>S/L</th><th>T/P</th><th>Placed</th><th /></tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-slate-500">No pending orders</td></tr>
                )}
                {orders.map((o) => {
                  const d = digitsFor(o.symbol);
                  return (
                    <tr key={o.id}>
                      <td className="font-semibold text-white">{o.symbol}</td>
                      <td className={o.side === "BUY" ? "text-up" : "text-down"}>{o.side} {o.type}</td>
                      <td className="font-mono">{o.volume.toFixed(2)}</td>
                      <td className="font-mono">{price(o.price, d)}</td>
                      <td className="font-mono">{price(o.stopLoss, d)}</td>
                      <td className="font-mono">{price(o.takeProfit, d)}</td>
                      <td className="text-xs text-slate-400">{dateTime(o.createdAt)}</td>
                      <td className="text-right">
                        <button className="rounded-md bg-ink-700 px-2 py-1 text-xs text-white hover:bg-ink-600" onClick={() => cancelOrder(o)}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
