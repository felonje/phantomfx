import { requireUser } from "@/lib/auth";
import { HttpError, json, rateLimit, route } from "@/lib/http";
import { mail } from "@/server/mailer";
import { issueToken } from "@/server/security";

export const POST = route(async () => {
  const user = await requireUser();
  if (user.emailVerifiedAt) throw new HttpError(400, "Your email is already verified");
  rateLimit(`resend-verify:${user.id}`, 3, 60 * 60 * 1000);
  const token = await issueToken(user.id, "VERIFY_EMAIL", 24 * 60 * 60 * 1000);
  await mail.verifyEmail(user.email, user.name, token);
  return json({ ok: true });
});
