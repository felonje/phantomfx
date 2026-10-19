import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, json, parseBody, rateLimit, route } from "@/lib/http";
import { audit } from "@/server/accounts";
import { mail } from "@/server/mailer";
import { issueToken } from "@/server/security";

const schema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) });

// Always responds the same way so the endpoint can't be used to discover registered emails.
export const POST = route(async (req: Request) => {
  rateLimit(`forgot:${clientIp(req)}`, 10, 60 * 60 * 1000);
  const { email } = await parseBody(req, schema);
  rateLimit(`forgot-email:${email}`, 3, 60 * 60 * 1000);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.status === "ACTIVE") {
    const token = await issueToken(user.id, "RESET_PASSWORD", 60 * 60 * 1000);
    await mail.resetPassword(user.email, token);
    await audit(user.id, "user.password_reset_requested", "User", user.id, { ip: clientIp(req) });
  }
  return json({ ok: true });
});
