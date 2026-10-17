import { prisma } from "@/lib/db";
import { json } from "@/lib/http";
import { priceFeed } from "@/server/prices";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = false;
  }
  const feed = { mode: priceFeed.mode, stale: priceFeed.isStale(), lastUpdate: priceFeed.lastUpdate };
  return json({ ok: db, db, feed, uptime: Math.round(process.uptime()) }, { status: db ? 200 : 503 });
}
