import { z } from "zod";
import { createSession, verifyTwoFactorTicket } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, clientIp, json, parseBody, rateLimit, route } from "@/lib/http";
import { verifyTotp } from "@/lib/totp";
import { audit } from "@/server/accounts";
import { mail } from "@/server/mailer";
import { redeemRecoveryCode } from "@/server/security";

const schema = z.object({ ticket: z.string().min(1), code: z.string().trim().min(6).max(20) });

export const POST = route(async (req: Request) => {
  const body = await parseBody(req, schema);
  const userId = await verifyTwoFactorTicket(body.ticket);
  if (!userId) throw new HttpError(401, "Your sign-in attempt expired, please sign in again");
  rateLimit(`2fa:${userId}`, 8, 15 * 60 * 1000);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "ACTIVE" || !user.totpEnabled || !user.totpSecret) throw new HttpError(401, "Please sign in again");
  let usedRecovery = false;
  if (!verifyTotp(user.totpSecret, body.code)) {
    const remaining = redeemRecoveryCode(user.recoveryCodes, body.code);
    if (!remaining) throw new HttpError(401, "Invalid authentication code");
    await prisma.user.update({ where: { id: user.id }, data: { recoveryCodes: remaining } });
    usedRecovery = true;
  }
  await createSession(user.id);
  await audit(user.id, "user.login", "User", user.id, { ip: clientIp(req), twoFactor: usedRecovery ? "recovery" : "totp" });
  if (usedRecovery) await mail.securityNotice(user.email, "A 2FA recovery code was used to sign in");
  return json({ ok: true, role: user.role });
});
