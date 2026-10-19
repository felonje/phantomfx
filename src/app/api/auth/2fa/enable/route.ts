import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, rateLimit, route } from "@/lib/http";
import { verifyTotp } from "@/lib/totp";
import { audit } from "@/server/accounts";
import { mail } from "@/server/mailer";
import { generateRecoveryCodes } from "@/server/security";

const schema = z.object({ code: z.string().trim().min(6).max(10) });

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  rateLimit(`2fa-enable:${user.id}`, 10, 15 * 60 * 1000);
  const { code } = await parseBody(req, schema);
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (record.totpEnabled) throw new HttpError(400, "Two-factor authentication is already enabled");
  if (!record.totpSecret) throw new HttpError(400, "Start the setup first");
  if (!verifyTotp(record.totpSecret, code)) throw new HttpError(400, "Invalid code, check your authenticator app's time and try again");
  const { codes, hashes } = generateRecoveryCodes();
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true, recoveryCodes: hashes } });
  await audit(user.id, "user.2fa_enabled", "User", user.id);
  await mail.securityNotice(user.email, "Two-factor authentication was enabled");
  return json({ recoveryCodes: codes });
});
