"use client";

import { useEffect, useState } from "react";

export interface Tick {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  changePct: number;
  time: number;
}

export interface FeedState {
  ticks: Record<string, Tick>;
  mode: string;
  marketOpen: boolean;
  connected: boolean;
}

export function usePrices(): FeedState {
  const [state, setState] = useState<FeedState>({ ticks: {}, mode: "", marketOpen: true, connected: false });
  useEffect(() => {
    const es = new EventSource("/api/prices/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as { ticks: Tick[]; mode: string; marketOpen: boolean };
      setState((prev) => {
        const ticks = { ...prev.ticks };
        for (const t of data.ticks) ticks[t.symbol] = t;
        return { ticks, mode: data.mode, marketOpen: data.marketOpen, connected: true };
      });
    };
    es.onerror = () => setState((s) => ({ ...s, connected: false }));
    return () => es.close();
  }, []);
  return state;
}
