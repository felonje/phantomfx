import { z } from "zod";
import { hashPassword, requireUser, revokeSessions, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, rateLimit, route } from "@/lib/http";
import { passwordSchema } from "@/lib/validation";
import { audit } from "@/server/accounts";
import { mail } from "@/server/mailer";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  rateLimit(`change-pw:${user.id}`, 5, 15 * 60 * 1000);
  const body = await parseBody(req, schema);
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(body.currentPassword, record.passwordHash))) throw new HttpError(400, "Current password is incorrect");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.newPassword) } });
  await revokeSessions(user.id, user.sessionId);
  await audit(user.id, "user.password_changed", "User", user.id);
  await mail.securityNotice(user.email, "Your password was changed");
  return json({ ok: true });
});
