import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";

export const GET = route(async (req: Request) => {
  await requireAdmin();
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, email: true, name: true, phone: true, country: true, role: true, status: true, createdAt: true, emailVerifiedAt: true, totpEnabled: true,
      accounts: { select: { id: true, login: true, type: true, balance: true, leverage: true } },
    },
  });
  return json({ users });
});
