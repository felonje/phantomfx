import { EventEmitter } from "node:events";
import { INSTRUMENTS } from "@/lib/instruments";
import { isFxMarketOpen, quoteFromMid, roundTo, type QuoteMap } from "@/lib/trading/math";
import { getInstruments, instrumentsSync } from "./instrumentCache";

export interface Tick {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  changePct: number;
  time: number;
}

type FeedMode = "yahoo" | "simulated";

const UA = "Mozilla/5.0";
const YAHOO_POLL_MS = 2500;
const SIM_TICK_MS = 1000;

class PriceFeed extends EventEmitter {
  mode: FeedMode = process.env.PRICE_FEED === "simulated" ? "simulated" : "yahoo";
  private mids = new Map<string, { mid: number; prevClose: number; time: number }>();
  private timer: NodeJS.Timeout | null = null;
  private failures = 0;
  started = false;
  lastUpdate = 0;

  start() {
    if (this.started) return;
    this.started = true;
    this.setMaxListeners(1000);
    if (this.mode === "yahoo") void this.pollYahoo();
    else this.startSimulation();
  }

  private async pollYahoo() {
    try {
      const symbols = INSTRUMENTS.map((i) => i.yahoo).join(",");
      const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1d&interval=1m`;
      const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
      const data = await res.json();
      const now = Date.now();
      for (const r of data?.spark?.result ?? []) {
        const meta = r?.response?.[0]?.meta;
        const inst = INSTRUMENTS.find((i) => i.yahoo === r.symbol);
        if (!inst || !meta?.regularMarketPrice) continue;
        this.mids.set(inst.symbol, {
          mid: meta.regularMarketPrice,
          prevClose: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice,
          time: (meta.regularMarketTime ?? now / 1000) * 1000,
        });
      }
      this.failures = 0;
      this.lastUpdate = now;
      this.publish();
    } catch (err) {
      this.failures += 1;
      if (this.failures === 1 || this.failures % 20 === 0) console.warn("[prices] Yahoo feed error:", (err as Error).message);
      if (this.mids.size === 0 && this.failures >= 3) {
        console.warn("[prices] Live feed unavailable, switching to simulated prices");
        this.mode = "simulated";
        this.startSimulation();
        return;
      }
    }
    this.timer = setTimeout(() => void this.pollYahoo(), YAHOO_POLL_MS);
  }

  private startSimulation() {
    for (const inst of INSTRUMENTS) {
      if (!this.mids.has(inst.symbol)) {
        this.mids.set(inst.symbol, { mid: inst.seedPrice, prevClose: inst.seedPrice, time: Date.now() });
      }
    }
    simHistory.seed(this.mids);
    const step = () => {
      const now = Date.now();
      for (const [symbol, m] of this.mids) {
        // Geometric random walk, ~8% annualised volatility per second tick.
        const sigma = 0.08 / Math.sqrt(365 * 24 * 3600);
        const mid = m.mid * Math.exp(sigma * gaussian());
        this.mids.set(symbol, { ...m, mid, time: now });
        simHistory.push(symbol, mid, now);
      }
      this.lastUpdate = now;
      this.publish();
    };
    if (this.timer) clearTimeout(this.timer);
    this.timer = setInterval(step, SIM_TICK_MS);
    step();
  }

  private publish() {
    this.emit("ticks", this.ticks());
  }

  ticks(): Tick[] {
    const insts = instrumentsSync();
    const out: Tick[] = [];
    for (const [symbol, m] of this.mids) {
      const inst = insts.get(symbol);
      if (!inst) continue;
      const { bid, ask } = quoteFromMid(m.mid, inst.spreadPips, inst.pipSize, inst.digits);
      out.push({
        symbol,
        bid,
        ask,
        mid: roundTo(m.mid, inst.digits + 1),
        changePct: m.prevClose ? roundTo(((m.mid - m.prevClose) / m.prevClose) * 100, 3) : 0,
        time: m.time,
      });
    }
    return out;
  }

  quotes(): QuoteMap {
    const q: QuoteMap = {};
    for (const t of this.ticks()) q[t.symbol] = { bid: t.bid, ask: t.ask, time: t.time };
    return q;
  }

  isStale() {
    return Date.now() - this.lastUpdate > 30_000;
  }
}

function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** In-memory 1-minute bars used when running on simulated prices. */
class SimHistory {
  private bars = new Map<string, Candle[]>();

  seed(mids: Map<string, { mid: number }>) {
    const nowMin = Math.floor(Date.now() / 60_000) * 60;
    for (const [symbol, { mid }] of mids) {
      if (this.bars.has(symbol)) continue;
      const bars: Candle[] = [];
      let price = mid;
      const sigma = 0.08 / Math.sqrt(365 * 24 * 60);
      for (let i = 0; i < 3000; i++) {
        const close = price;
        const open = close / Math.exp(sigma * gaussian());
        const high = Math.max(open, close) * (1 + Math.abs(gaussian()) * sigma * 0.5);
        const low = Math.min(open, close) * (1 - Math.abs(gaussian()) * sigma * 0.5);
        bars.unshift({ time: nowMin - i * 60, open, high, low, close });
        price = open;
      }
      this.bars.set(symbol, bars);
    }
  }

  push(symbol: string, price: number, timeMs: number) {
    const bars = this.bars.get(symbol);
    if (!bars) return;
    const t = Math.floor(timeMs / 60_000) * 60;
    const last = bars[bars.length - 1];
    if (last && last.time === t) {
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      last.close = price;
    } else {
      bars.push({ time: t, open: last?.close ?? price, high: price, low: price, close: price });
      if (bars.length > 20_000) bars.shift();
    }
  }

  get(symbol: string, seconds: number): Candle[] {
    const bars = this.bars.get(symbol) ?? [];
    if (seconds === 60) return bars.map((b) => ({ ...b }));
    const out: Candle[] = [];
    for (const b of bars) {
      const t = Math.floor(b.time / seconds) * seconds;
      const last = out[out.length - 1];
      if (last && last.time === t) {
        last.high = Math.max(last.high, b.high);
        last.low = Math.min(last.low, b.low);
        last.close = b.close;
      } else out.push({ ...b, time: t });
    }
    return out;
  }
}

const g = globalThis as unknown as { __priceFeed?: PriceFeed; __simHistory?: SimHistory };
const simHistory = (g.__simHistory ??= new SimHistory());
export const priceFeed = (g.__priceFeed ??= new PriceFeed());

export const TIMEFRAMES: Record<string, { seconds: number; yahooInterval: string; yahooRange: string }> = {
  "1m": { seconds: 60, yahooInterval: "1m", yahooRange: "1d" },
  "5m": { seconds: 300, yahooInterval: "5m", yahooRange: "5d" },
  "15m": { seconds: 900, yahooInterval: "15m", yahooRange: "5d" },
  "1h": { seconds: 3600, yahooInterval: "60m", yahooRange: "1mo" },
  "1d": { seconds: 86400, yahooInterval: "1d", yahooRange: "1y" },
};

const candleCache = new Map<string, { at: number; data: Candle[] }>();

export async function getCandles(symbol: string, tf: string): Promise<Candle[]> {
  const frame = TIMEFRAMES[tf] ?? TIMEFRAMES["1m"];
  const inst = (await getInstruments()).get(symbol);
  if (!inst) return [];
  if (priceFeed.mode === "simulated") return simHistory.get(symbol, frame.seconds);

  const key = `${symbol}:${tf}`;
  const cached = candleCache.get(key);
  if (cached && Date.now() - cached.at < 20_000) return cached.data;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(inst.yahoo)}?interval=${frame.yahooInterval}&range=${frame.yahooRange}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
    const json = await res.json();
    const r = json?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const q = r?.indicators?.quote?.[0] ?? {};
    const data: Candle[] = [];
    ts.forEach((t, i) => {
      const [o, h, l, c] = [q.open?.[i], q.high?.[i], q.low?.[i], q.close?.[i]];
      if ([o, h, l, c].some((v) => v == null)) return;
      const time = Math.floor(t / frame.seconds) * frame.seconds;
      const last = data[data.length - 1];
      if (last && last.time === time) {
        last.high = Math.max(last.high, h);
        last.low = Math.min(last.low, l);
        last.close = c;
      } else data.push({ time, open: o, high: h, low: l, close: c });
    });
    candleCache.set(key, { at: Date.now(), data });
    return data;
  } catch (err) {
    console.warn("[prices] candle fetch failed:", (err as Error).message);
    return cached?.data ?? [];
  }
}

export function marketOpen() {
  if (process.env.ENFORCE_MARKET_HOURS === "false" || priceFeed.mode === "simulated") return true;
  return isFxMarketOpen();
}
