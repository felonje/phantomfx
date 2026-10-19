import { z } from "zod";
import { hashPassword, revokeSessions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, clientIp, json, parseBody, rateLimit, route } from "@/lib/http";
import { passwordSchema } from "@/lib/validation";
import { audit } from "@/server/accounts";
import { mail } from "@/server/mailer";
import { consumeToken } from "@/server/security";

const schema = z.object({ token: z.string().min(10).max(200), password: passwordSchema });

export const POST = route(async (req: Request) => {
  rateLimit(`reset:${clientIp(req)}`, 20, 60 * 60 * 1000);
  const body = await parseBody(req, schema);
  const userId = await consumeToken(body.token, "RESET_PASSWORD");
  if (!userId) throw new HttpError(400, "This reset link is invalid or has expired");
  // Following an emailed link also proves ownership of the address.
  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(body.password), emailVerifiedAt: new Date() },
  });
  await revokeSessions(userId);
  await audit(userId, "user.password_reset", "User", userId, { ip: clientIp(req) });
  await mail.securityNotice(user.email, "Your password was reset");
  return json({ ok: true });
});
