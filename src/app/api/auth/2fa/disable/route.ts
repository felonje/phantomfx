import { z } from "zod";
import { requireUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, rateLimit, route } from "@/lib/http";
import { verifyTotp } from "@/lib/totp";
import { audit } from "@/server/accounts";
import { mail } from "@/server/mailer";
import { redeemRecoveryCode } from "@/server/security";

const schema = z.object({ password: z.string().min(1), code: z.string().trim().min(6).max(20) });

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  rateLimit(`2fa-disable:${user.id}`, 5, 15 * 60 * 1000);
  const body = await parseBody(req, schema);
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!record.totpEnabled || !record.totpSecret) throw new HttpError(400, "Two-factor authentication is not enabled");
  if (!(await verifyPassword(body.password, record.passwordHash))) throw new HttpError(400, "Password is incorrect");
  if (!verifyTotp(record.totpSecret, body.code) && !redeemRecoveryCode(record.recoveryCodes, body.code)) {
    throw new HttpError(400, "Invalid authentication code");
  }
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null, recoveryCodes: null } });
  await audit(user.id, "user.2fa_disabled", "User", user.id);
  await mail.securityNotice(user.email, "Two-factor authentication was disabled");
  return json({ ok: true });
});
