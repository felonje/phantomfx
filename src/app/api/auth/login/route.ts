import { z } from "zod";
import { createSession, signTwoFactorTicket, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, clientIp, json, parseBody, rateLimit, route } from "@/lib/http";
import { audit } from "@/server/accounts";

const schema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string().min(1),
});

export const POST = route(async (req: Request) => {
  const body = await parseBody(req, schema);
  const ip = clientIp(req);
  rateLimit(`login-ip:${ip}`, 50, 15 * 60 * 1000);
  rateLimit(`login:${ip}:${body.email}`, 10, 15 * 60 * 1000);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    await audit(user?.id ?? null, "user.login_failed", "User", user?.id, { ip, email: body.email });
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.status !== "ACTIVE") throw new HttpError(403, "This account has been suspended");
  if (user.totpEnabled) return json({ twoFactor: true, ticket: await signTwoFactorTicket(user.id) });
  await createSession(user.id);
  await audit(user.id, "user.login", "User", user.id, { ip });
  return json({ ok: true, role: user.role });
});
