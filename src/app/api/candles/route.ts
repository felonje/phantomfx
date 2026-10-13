import { json, route } from "@/lib/http";
import { getCandles } from "@/server/prices";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol") ?? "EURUSD";
  const tf = url.searchParams.get("tf") ?? "1m";
  return json({ candles: await getCandles(symbol, tf) });
});
