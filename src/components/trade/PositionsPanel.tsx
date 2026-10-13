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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-ink-700 px-2">
        <button className={`tab ${tab === "positions" ? "tab-active" : ""}`} onClick={() => setTab("positions")}>
          Positions ({positions.length})
        </button>
        <button className={`tab ${tab === "orders" ? "tab-active" : ""}`} onClick={() => setTab("orders")}>
          Pending orders ({orders.length})
        </button>
        {tab === "positions" && positions.length > 1 && (
          <button className="ml-auto text-xs text-slate-400 hover:text-white" onClick={closeAll}>
            Close all
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {tab === "positions" ? (
          <table className="table">
            <thead>
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
                        <td><input className="input w-24 px-2 py-1 font-mono text-xs" value={sl} onChange={(e) => setSl(e.target.value)} /></td>
                        <td><input className="input w-24 px-2 py-1 font-mono text-xs" value={tp} onChange={(e) => setTp(e.target.value)} /></td>
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
                          <button
                            className="text-xs text-brand-400"
                            onClick={() =>
                              run(
                                () =>
                                  api(`/api/positions/${p.id}`, {
                                    method: "PATCH",
                                    body: { stopLoss: sl ? Number(sl) : null, takeProfit: tp ? Number(tp) : null },
                                  }).then(() => setEditing(null)),
                                "Position modified",
                              )
                            }
                          >
                            Save
                          </button>
                          <button className="text-xs text-slate-400" onClick={() => setEditing(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="text-xs text-slate-400 hover:text-white"
                            onClick={() => {
                              setEditing(p.id);
                              setSl(p.stopLoss?.toString() ?? "");
                              setTp(p.takeProfit?.toString() ?? "");
                            }}
                          >
                            Modify
                          </button>
                          <button
                            className="rounded bg-ink-700 px-2 py-1 text-xs text-white hover:bg-ink-600"
                            onClick={() => run(() => api(`/api/positions/${p.id}/close`, { method: "POST" }), `${p.symbol} position closed`)}
                          >
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
        ) : (
          <table className="table">
            <thead>
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
                      <button
                        className="rounded bg-ink-700 px-2 py-1 text-xs text-white hover:bg-ink-600"
                        onClick={() => run(() => api(`/api/orders/${o.id}`, { method: "DELETE" }), "Order cancelled")}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
