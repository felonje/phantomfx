import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";

export const GET = route(async () => {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))] as string[];
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, email: true } });
  const emails = Object.fromEntries(actors.map((a) => [a.id, a.email]));
  return json({ logs: logs.map((l) => ({ ...l, actor: l.actorId ? emails[l.actorId] ?? l.actorId : "system" })) });
});
