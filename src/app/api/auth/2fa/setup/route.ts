import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, route } from "@/lib/http";
import { generateTotpSecret, otpauthUrl } from "@/lib/totp";

export const POST = route(async () => {
  const user = await requireUser();
  if (user.totpEnabled) throw new HttpError(400, "Two-factor authentication is already enabled");
  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret } });
  const url = otpauthUrl(secret, user.email);
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 });
  return json({ secret, qr });
});
