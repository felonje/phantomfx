"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { dateTime, usd } from "@/lib/client/format";
import { PAYMENT_METHODS } from "@/lib/payments";
import type { Metrics } from "@/components/trade/types";

interface Tx {
  id: string;
  type: string;
  amount: number;
  status: string;
  method: string | null;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

const statusClass: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400",
  COMPLETED: "bg-up/15 text-up",
  REJECTED: "bg-down/15 text-down",
};

export default function WalletPage() {
  const [data, setData] = useState<{ account: { login: number; leverage: number }; metrics: Metrics; transactions: Tx[] } | null>(null);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api<typeof data>("/api/wallet").then(setData), []);
  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/wallet/${mode}`, {
        body: { amount: Number(f.get("amount")), method: f.get("method"), reference: f.get("reference") },
      });
      setMsg({
        text:
          mode === "deposit"
            ? "Deposit submitted. Your balance will be credited once the payment is confirmed."
            : "Withdrawal requested. Funds have been reserved and will be paid out after review.",
      });
      form.reset();
      await load();
    } catch (err) {
      setMsg({ text: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  };

  const m = data?.metrics;
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Wallet</h1>
        <p className="text-sm text-slate-400">Live account {data ? `#${data.account.login}` : ""} · USD</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Balance", m?.balance],
          ["Equity", m?.equity],
          ["Used margin", m?.margin],
          ["Withdrawable", m ? Math.max(0, Math.min(m.freeMargin, m.balance)) : undefined],
        ].map(([label, v]) => (
          <div key={label as string} className="card p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-xl text-white">{usd(v as number | undefined)}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="card space-y-4 p-5">
          <div className="grid grid-cols-2 gap-1 rounded-md bg-ink-950 p-1">
            {(["deposit", "withdraw"] as const).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => {
                  setMode(k);
                  setMsg(null);
                }}
                className={`rounded py-1.5 text-sm font-semibold capitalize ${mode === k ? "bg-ink-700 text-white" : "text-slate-400"}`}
              >
                {k}
              </button>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="amount">Amount (USD)</label>
            <input className="input font-mono" id="amount" name="amount" type="number" min={10} step="0.01" required />
          </div>
          <div>
            <label className="label" htmlFor="method">Method</label>
            <select className="input" id="method" name="method">
              {PAYMENT_METHODS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="reference">{mode === "deposit" ? "Payment reference / transaction code" : "Payout details"}</label>
            <input
              className="input"
              id="reference"
              name="reference"
              required
              placeholder={mode === "deposit" ? "e.g. M-Pesa code QJK3XY12AB" : "e.g. M-Pesa number, bank account or wallet"}
            />
          </div>
          {mode === "deposit" && (
            <p className="rounded bg-ink-800 p-3 text-xs text-slate-400">
              Send your payment using the company payment details, then submit the transaction code here. Deposits are
              credited after confirmation by our finance team.
            </p>
          )}
          {msg && <p className={`rounded px-3 py-2 text-sm ${msg.error ? "bg-down/10 text-down" : "bg-up/10 text-up"}`}>{msg.text}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Submitting…" : mode === "deposit" ? "Submit deposit" : "Request withdrawal"}
          </button>
        </form>

        <div className="card overflow-hidden">
          <div className="border-b border-ink-700 px-4 py-3 text-sm font-semibold text-white">Transactions</div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Type</th><th>Method</th><th>Reference</th><th>Status</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {data?.transactions.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">No transactions yet</td></tr>
                )}
                {data?.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="text-xs text-slate-400">{dateTime(t.createdAt)}</td>
                    <td>{t.type}</td>
                    <td>{t.method ?? "—"}</td>
                    <td className="max-w-[180px] truncate text-xs" title={t.note ?? t.reference ?? ""}>{t.reference ?? t.note ?? "—"}</td>
                    <td><span className={`badge ${statusClass[t.status] ?? ""}`}>{t.status}</span></td>
                    <td className={`text-right font-mono ${t.amount >= 0 ? "text-up" : "text-down"}`}>{usd(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
