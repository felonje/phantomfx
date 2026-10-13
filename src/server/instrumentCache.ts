import { prisma } from "@/lib/db";
import { CONTRACT_SIZE, INSTRUMENT_META, type InstrumentMeta } from "@/lib/instruments";
import type { InstrumentSpec } from "@/lib/trading/math";

export interface Instrument extends InstrumentSpec {
  description: string;
  yahoo: string;
  spreadPips: number;
  commissionPerLot: number;
  minLot: number;
  maxLot: number;
  enabled: boolean;
  sort: number;
}

const g = globalThis as unknown as { __instruments?: { map: Map<string, Instrument>; loadedAt: number } };

function fromMeta(meta: InstrumentMeta, i: number): Instrument {
  return {
    symbol: meta.symbol,
    base: meta.base,
    quote: meta.quote,
    description: meta.description,
    yahoo: meta.yahoo,
    digits: meta.digits,
    pipSize: meta.pipSize,
    contractSize: CONTRACT_SIZE,
    spreadPips: meta.spreadPips,
    commissionPerLot: 0,
    minLot: 0.01,
    maxLot: 50,
    enabled: true,
    sort: i,
  };
}

export async function reloadInstruments() {
  const rows = await prisma.instrument.findMany();
  const map = new Map<string, Instrument>();
  Object.values(INSTRUMENT_META).forEach((meta, i) => map.set(meta.symbol, fromMeta(meta, i)));
  for (const r of rows) {
    const meta = INSTRUMENT_META[r.symbol];
    if (!meta) continue;
    map.set(r.symbol, { ...fromMeta(meta, r.sort), ...r });
  }
  g.__instruments = { map, loadedAt: Date.now() };
  return map;
}

export function instrumentsSync(): Map<string, Instrument> {
  if (!g.__instruments) {
    const map = new Map<string, Instrument>();
    Object.values(INSTRUMENT_META).forEach((meta, i) => map.set(meta.symbol, fromMeta(meta, i)));
    return map;
  }
  return g.__instruments.map;
}

export async function getInstruments(): Promise<Map<string, Instrument>> {
  if (!g.__instruments || Date.now() - g.__instruments.loadedAt > 30_000) return reloadInstruments();
  return g.__instruments.map;
}

export async function getInstrument(symbol: string) {
  return (await getInstruments()).get(symbol) ?? null;
}
