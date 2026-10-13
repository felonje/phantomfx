import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, route } from "@/lib/http";
import { closePosition } from "@/server/trading";

export const POST = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const pos = await prisma.position.findFirst({ where: { id, account: { userId: user.id } } });
  if (!pos) throw new HttpError(404, "Position not found");
  return json({ position: await closePosition(id, pos.accountId, "MANUAL") });
});
