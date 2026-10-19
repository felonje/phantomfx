import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const res = await prisma.session.updateMany({ where: { id, userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  if (res.count === 0) throw new HttpError(404, "Session not found");
  return json({ ok: true });
});
