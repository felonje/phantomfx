import { z } from "zod";
import { requireAdmin, revokeSessions } from "@/lib/auth";
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
      id: true, email: true, name: true, phone: true, country: true, role: true, status: true, createdAt: true, emailVerifiedAt: true, totpEnabled: true,
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

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  resetTwoFactor: z.literal(true).optional(),
  verifyEmail: z.literal(true).optional(),
});

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);
  if (id === admin.id) throw new HttpError(400, "You cannot change your own role or status");
  const { resetTwoFactor, verifyEmail, ...rest } = body;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(resetTwoFactor ? { totpEnabled: false, totpSecret: null, recoveryCodes: null } : {}),
      ...(verifyEmail ? { emailVerifiedAt: new Date() } : {}),
    },
    select: { id: true, status: true, role: true },
  });
  if (body.status === "SUSPENDED" || resetTwoFactor) await revokeSessions(id);
  await audit(admin.id, "admin.user_update", "User", id, body);
  return json({ user });
});
