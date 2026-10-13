import { requireOwnAccount, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await requireOwnAccount(user.id, id);
  const [positions, orders, transactions] = await Promise.all([
    prisma.position.findMany({ where: { accountId: id, status: "CLOSED" }, orderBy: { closedAt: "desc" }, take: 200 }),
    prisma.order.findMany({ where: { accountId: id, status: { not: "PENDING" } }, orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.transaction.findMany({ where: { accountId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  return json({ positions, orders, transactions });
});
