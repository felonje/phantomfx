"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";
import { price, usd } from "@/lib/client/format";
import type { Tick } from "@/lib/client/usePrices";
import type { InstrumentInfo } from "./types";

type OrderType = "MARKET" | "LIMIT" | "STOP";

const num = (v: string) => (v.trim() === "" ? null : Number(v));

export function OrderTicket({
  accountId,
  leverage,
  instrument,
  tick,
  disabled,
  onPlaced,
}: {
  accountId: string;
  leverage: number;
  instrument: InstrumentInfo;
  tick?: Tick;
  disabled?: string | null;
  onPlaced: (msg: string) => void;
}) {
  const [type, setType] = useState<OrderType>("MARKET");
  const [volume, setVolume] = useState("0.10");
  const [orderPrice, setOrderPrice] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [busy, setBusy] = useState<"BUY" | "SELL" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lots = Number(volume) || 0;
  const units = lots * instrument.contractSize;
  const pipValueQuote = units * instrument.pipSize;
  const midPx = tick?.mid ?? 0;
  const quoteToUsd = instrument.quote === "USD" ? 1 : instrument.base === "USD" && midPx ? 1 / midPx : null;
  const baseToUsd = instrument.base === "USD" ? 1 : instrument.quote === "USD" ? midPx : null;

  const submit = async (side: "BUY" | "SELL") => {
    setError(null);
    setBusy(side);
    try {
      const res = await api<{ kind: string }>("/api/orders", {
        body: {
          accountId,
          symbol: instrument.symbol,
          side,
          type,
          volume: lots,
          price: type === "MARKET" ? null : num(orderPrice),
          stopLoss: num(sl),
          takeProfit: num(tp),
        },
      });
      onPlaced(
        res.kind === "position"
          ? `${side} ${lots} ${instrument.symbol} executed`
          : `${side} ${type.toLowerCase()} ${lots} ${instrument.symbol} @ ${orderPrice} placed`,
      );
      setSl("");
      setTp("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const step = (delta: number) => setVolume((v) => Math.max(instrument.minLot, Math.round(((Number(v) || 0) + delta) * 100) / 100).toFixed(2));

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm font-semibold text-white">{instrument.symbol}</div>
          <div className="text-xs text-slate-500">{instrument.description}</div>
        </div>
        <div className="text-xs text-slate-500">1:{leverage}</div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-md bg-ink-950 p-1">
        {(["MARKET", "LIMIT", "STOP"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded py-1 text-xs font-semibold ${type === t ? "bg-ink-700 text-white" : "text-slate-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className="label">Volume (lots)</label>
        <div className="flex gap-1">
          <button className="btn-ghost px-3" onClick={() => step(-0.01)} type="button">−</button>
          <input className="input text-center font-mono" value={volume} onChange={(e) => setVolume(e.target.value)} inputMode="decimal" />
          <button className="btn-ghost px-3" onClick={() => step(0.01)} type="button">+</button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {units.toLocaleString()} {instrument.base} · pip ≈ {quoteToUsd ? usd(pipValueQuote * quoteToUsd) : `${pipValueQuote.toFixed(2)} ${instrument.quote}`}
          {baseToUsd ? ` · margin ≈ ${usd((units * baseToUsd) / leverage)}` : ""}
        </p>
      </div>

      {type !== "MARKET" && (
        <div>
          <label className="label">{type === "LIMIT" ? "Limit" : "Stop"} price</label>
          <input
            className="input font-mono"
            value={orderPrice}
            onChange={(e) => setOrderPrice(e.target.value)}
            placeholder={price(tick?.mid, instrument.digits)}
            inputMode="decimal"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Stop loss</label>
          <input className="input font-mono" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="optional" inputMode="decimal" />
        </div>
        <div>
          <label className="label">Take profit</label>
          <input className="input font-mono" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="optional" inputMode="decimal" />
        </div>
      </div>

      {error && <p className="rounded bg-down/10 px-3 py-2 text-xs text-down">{error}</p>}
      {disabled && <p className="rounded bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">{disabled}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-sell flex-col gap-0 py-2" disabled={!!busy || !tick || !!disabled} onClick={() => submit("SELL")}>
          <span className="text-xs font-medium opacity-80">{busy === "SELL" ? "Sending…" : `SELL ${type === "MARKET" ? "" : type}`}</span>
          <span className="font-mono text-base">{price(tick?.bid, instrument.digits)}</span>
        </button>
        <button className="btn-buy flex-col gap-0 py-2" disabled={!!busy || !tick || !!disabled} onClick={() => submit("BUY")}>
          <span className="text-xs font-medium opacity-80">{busy === "BUY" ? "Sending…" : `BUY ${type === "MARKET" ? "" : type}`}</span>
          <span className="font-mono text-base">{price(tick?.ask, instrument.digits)}</span>
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-500">
        Spread {tick ? ((tick.ask - tick.bid) / instrument.pipSize).toFixed(1) : "—"} pips
        {instrument.commissionPerLot > 0 ? ` · commission ${usd(instrument.commissionPerLot)}/lot` : " · no commission"}
      </p>
    </div>
  );
}
