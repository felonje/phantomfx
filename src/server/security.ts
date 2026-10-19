import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");

export type TokenType = "VERIFY_EMAIL" | "RESET_PASSWORD";

/** Issues a single-use token; only its hash is stored. Previous unused tokens of the same type are invalidated. */
export async function issueToken(userId: string, type: TokenType, ttlMs: number) {
  const raw = randomToken();
  await prisma.$transaction([
    prisma.authToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.authToken.create({ data: { userId, type, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + ttlMs) } }),
  ]);
  return raw;
}

/** Atomically marks a valid token as used and returns its user id, or null if invalid/expired/used. */
export async function consumeToken(raw: string, type: TokenType) {
  const tokenHash = sha256(raw);
  const res = await prisma.authToken.updateMany({
    where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (res.count !== 1) return null;
  const token = await prisma.authToken.findUnique({ where: { tokenHash }, select: { userId: true } });
  return token?.userId ?? null;
}

export function generateRecoveryCodes(n = 8) {
  const codes = Array.from({ length: n }, () => {
    const s = randomBytes(5).toString("hex");
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
  return { codes, hashes: JSON.stringify(codes.map((c) => sha256(c))) };
}

const normalizeRecovery = (code: string) => code.trim().toLowerCase().replace(/\s/g, "");

/** Returns the updated hash list if the recovery code matched (and is now consumed), else null. */
export function redeemRecoveryCode(stored: string | null, code: string) {
  if (!stored) return null;
  const hashes: string[] = JSON.parse(stored);
  const h = sha256(normalizeRecovery(code));
  const idx = hashes.indexOf(h);
  if (idx < 0) return null;
  hashes.splice(idx, 1);
  return JSON.stringify(hashes);
}
