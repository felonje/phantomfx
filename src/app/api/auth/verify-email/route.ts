import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError, clientIp, json, parseBody, rateLimit, route } from "@/lib/http";
import { audit } from "@/server/accounts";
import { consumeToken } from "@/server/security";

const schema = z.object({ token: z.string().min(10).max(200) });

export const POST = route(async (req: Request) => {
  rateLimit(`verify:${clientIp(req)}`, 30, 60 * 60 * 1000);
  const { token } = await parseBody(req, schema);
  const userId = await consumeToken(token, "VERIFY_EMAIL");
  if (!userId) throw new HttpError(400, "This verification link is invalid or has expired");
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  await audit(userId, "user.email_verified", "User", userId);
  return json({ ok: true });
});
