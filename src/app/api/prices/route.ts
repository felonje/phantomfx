import { json, route } from "@/lib/http";
import { getInstruments } from "@/server/instrumentCache";
import { marketOpen, priceFeed } from "@/server/prices";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const instruments = [...(await getInstruments()).values()]
    .filter((i) => i.enabled)
    .sort((a, b) => a.sort - b.sort)
    .map(({ symbol, description, digits, pipSize, contractSize, minLot, maxLot, spreadPips, commissionPerLot, base, quote }) => ({
      symbol, description, digits, pipSize, contractSize, minLot, maxLot, spreadPips, commissionPerLot, base, quote,
    }));
  return json({ instruments, ticks: priceFeed.ticks(), mode: priceFeed.mode, marketOpen: marketOpen() });
});
