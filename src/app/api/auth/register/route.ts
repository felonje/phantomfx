import { z } from "zod";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, clientIp, json, parseBody, rateLimit, route } from "@/lib/http";
import { audit, createDefaultAccounts } from "@/server/accounts";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z.string().trim().max(30).optional(),
  country: z.string().trim().max(60).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const POST = route(async (req: Request) => {
  rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000);
  const body = await parseBody(req, schema);
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new HttpError(409, "An account with this email already exists");
  const passwordHash = await hashPassword(body.password);
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { name: body.name, email: body.email, phone: body.phone || null, country: body.country || null, passwordHash },
    });
    await createDefaultAccounts(tx, u.id);
    return u;
  });
  await audit(user.id, "user.register", "User", user.id);
  await createSession(user.id);
  return json({ ok: true });
});
