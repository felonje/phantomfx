import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";
import { round2 } from "@/lib/trading/math";
import { priceFeed } from "@/server/prices";
import { positionsWithPnl } from "@/server/trading";

export const GET = route(async (req: Request) => {
  await requireAdmin();
  const type = new URL(req.url).searchParams.get("type") ?? "LIVE";
  const rows = await prisma.position.findMany({
    where: { status: "OPEN", account: { type } },
    orderBy: { openedAt: "desc" },
    include: { account: { select: { login: true, user: { select: { name: true, email: true } } } } },
  });
  const positions = await positionsWithPnl(rows, priceFeed.quotes());
  const exposure: Record<string, { symbol: string; netLots: number; buyLots: number; sellLots: number; clientPnl: number }> = {};
  for (const p of positions) {
    const e = (exposure[p.symbol] ??= { symbol: p.symbol, netLots: 0, buyLots: 0, sellLots: 0, clientPnl: 0 });
    if (p.side === "BUY") e.buyLots += p.volume;
    else e.sellLots += p.volume;
    e.netLots = round2(e.buyLots - e.sellLots);
    e.clientPnl = round2(e.clientPnl + p.profit);
  }
  return json({ positions, exposure: Object.values(exposure) });
});
