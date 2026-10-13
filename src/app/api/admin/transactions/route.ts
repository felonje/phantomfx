import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";

export const GET = route(async (req: Request) => {
  await requireAdmin();
  const status = new URL(req.url).searchParams.get("status") ?? "PENDING";
  const transactions = await prisma.transaction.findMany({
    where: { type: { in: ["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"] }, account: { type: "LIVE" }, ...(status === "ALL" ? {} : { status }) },
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    take: 200,
    include: { account: { select: { login: true, user: { select: { id: true, name: true, email: true, phone: true } } } } },
  });
  return json({ transactions });
});
