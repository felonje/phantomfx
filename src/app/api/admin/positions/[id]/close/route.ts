import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, route } from "@/lib/http";
import { audit } from "@/server/accounts";
import { closePosition } from "@/server/trading";

export const POST = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const pos = await prisma.position.findUnique({ where: { id } });
  if (!pos) throw new HttpError(404, "Position not found");
  const closed = await closePosition(id, pos.accountId, "ADMIN");
  await audit(admin.id, "admin.position_close", "Position", id, { profit: closed.profit });
  return json({ position: closed });
});
