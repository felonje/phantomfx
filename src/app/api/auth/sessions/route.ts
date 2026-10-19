import { requireUser, revokeSessions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";
import { audit } from "@/server/accounts";

export const GET = route(async () => {
  const user = await requireUser();
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, ip: true, userAgent: true, createdAt: true, lastSeenAt: true },
  });
  return json({ sessions: sessions.map((s) => ({ ...s, current: s.id === user.sessionId })) });
});

/** Signs out every other device. */
export const DELETE = route(async () => {
  const user = await requireUser();
  await revokeSessions(user.id, user.sessionId);
  await audit(user.id, "user.sessions_revoked", "User", user.id);
  return json({ ok: true });
});
