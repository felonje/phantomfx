import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, route } from "@/lib/http";
import { cancelOrder } from "@/server/trading";

export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const order = await prisma.order.findFirst({ where: { id, account: { userId: user.id } } });
  if (!order) throw new HttpError(404, "Order not found");
  await cancelOrder(id, order.accountId);
  return json({ ok: true });
});
