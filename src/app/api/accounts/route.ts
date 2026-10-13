import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";
import { getAccountState } from "@/server/trading";

export const GET = route(async () => {
  const user = await requireUser();
  const accounts = await prisma.account.findMany({ where: { userId: user.id }, orderBy: { type: "asc" } });
  const states = await Promise.all(accounts.map((a) => getAccountState(a.id)));
  return json({ accounts: states.map((s) => ({ ...s.account, metrics: s.metrics, openPositions: s.positions.length })) });
});
