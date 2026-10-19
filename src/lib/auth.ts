import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { HttpError } from "./http";

const COOKIE = "pfx_session";
const MAX_AGE = 60 * 60 * 24 * 7;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (min 16 chars)");
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: h.get("user-agent")?.slice(0, 300) || null,
  };
}

export async function createSession(userId: string) {
  const session = await prisma.session.create({
    data: { userId, ...(await requestMeta()), expiresAt: new Date(Date.now() + MAX_AGE * 1000) },
  });
  const token = await new SignJWT({ sub: userId, sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
    path: "/",
    maxAge: MAX_AGE,
  });
}

async function readSessionClaims() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.sid !== "string") return null;
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const claims = await readSessionClaims();
  if (claims) await prisma.session.updateMany({ where: { id: claims.sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
  (await cookies()).delete(COOKIE);
}

export async function revokeSessions(userId: string, exceptSessionId?: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    data: { revokedAt: new Date() },
  });
}

const userSelect = {
  id: true, email: true, name: true, role: true, status: true, phone: true, country: true, createdAt: true,
  emailVerifiedAt: true, totpEnabled: true,
} as const;

export async function getCurrentUser() {
  const claims = await readSessionClaims();
  if (!claims) return null;
  const session = await prisma.session.findUnique({ where: { id: claims.sessionId }, include: { user: { select: userSelect } } });
  if (!session || session.revokedAt || session.expiresAt < new Date() || session.userId !== claims.userId) return null;
  if (session.user.status !== "ACTIVE") return null;
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return { ...session.user, sessionId: session.id };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Not authenticated");
  return user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.emailVerifiedAt) throw new HttpError(403, "Please verify your email address first");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new HttpError(403, "Admin access required");
  return user;
}

export async function requireOwnAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new HttpError(404, "Account not found");
  return account;
}

/** Short-lived token proving the password step passed, exchanged for a session once the 2FA code is checked. */
export async function signTwoFactorTicket(userId: string) {
  return new SignJWT({ sub: userId, purpose: "2fa" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m").sign(secret());
}

export async function verifyTwoFactorTicket(ticket: string) {
  try {
    const { payload } = await jwtVerify(ticket, secret());
    if (payload.purpose !== "2fa" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
