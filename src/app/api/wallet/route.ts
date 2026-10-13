import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, route } from "@/lib/http";
import { getAccountState } from "@/server/trading";

export const GET = route(async () => {
  const user = await requireUser();
  const live = await prisma.account.findFirst({ where: { userId: user.id, type: "LIVE" } });
  if (!live) throw new HttpError(404, "Live account not found");
  const [state, transactions] = await Promise.all([
    getAccountState(live.id),
    prisma.transaction.findMany({
      where: { accountId: live.id, type: { in: ["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return json({ account: state.account, metrics: state.metrics, transactions });
});
