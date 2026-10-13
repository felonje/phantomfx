import { z } from "zod";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, clientIp, json, parseBody, rateLimit, route } from "@/lib/http";
import { audit } from "@/server/accounts";

const schema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string().min(1),
});

export const POST = route(async (req: Request) => {
  const body = await parseBody(req, schema);
  rateLimit(`login:${clientIp(req)}:${body.email}`, 10, 15 * 60 * 1000);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.status !== "ACTIVE") throw new HttpError(403, "This account has been suspended");
  await createSession(user.id);
  await audit(user.id, "user.login", "User", user.id, { ip: clientIp(req) });
  return json({ ok: true, role: user.role });
});
