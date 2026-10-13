import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, route } from "@/lib/http";
import { audit } from "@/server/accounts";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, phone: true, country: true, role: true, status: true, createdAt: true,
      accounts: {
        include: {
          positions: { orderBy: { openedAt: "desc" }, take: 50 },
          transactions: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
    },
  });
  if (!user) throw new HttpError(404, "User not found");
  return json({ user });
});

const schema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]).optional(), role: z.enum(["USER", "ADMIN"]).optional() });

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);
  if (id === admin.id) throw new HttpError(400, "You cannot change your own role or status");
  const user = await prisma.user.update({ where: { id }, data: body, select: { id: true, status: true, role: true } });
  await audit(admin.id, "admin.user_update", "User", id, body);
  return json({ user });
});
