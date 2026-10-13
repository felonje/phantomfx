import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, route } from "@/lib/http";
import { audit } from "@/server/accounts";
import { withLock } from "@/server/lock";

const schema = z.object({ action: z.enum(["approve", "reject"]), note: z.string().max(300).optional() });

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { action, note } = await parseBody(req, schema);
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.status !== "PENDING") throw new HttpError(400, "Transaction is not pending");

  const tx = await withLock(existing.accountId, () =>
    prisma.$transaction(async (db) => {
      const claimed = await db.transaction.updateMany({
        where: { id, status: "PENDING" },
        data: { status: action === "approve" ? "COMPLETED" : "REJECTED", note: note || null, processedById: admin.id, processedAt: new Date() },
      });
      if (claimed.count === 0) throw new HttpError(400, "Transaction is not pending");
      // Deposits credit the balance on approval; withdrawals were reserved at request time and are refunded on rejection.
      if (existing.type === "DEPOSIT" && action === "approve") {
        await db.account.update({ where: { id: existing.accountId }, data: { balance: { increment: existing.amount } } });
      }
      if (existing.type === "WITHDRAWAL" && action === "reject") {
        await db.account.update({ where: { id: existing.accountId }, data: { balance: { increment: -existing.amount } } });
      }
      return db.transaction.findUniqueOrThrow({ where: { id } });
    }),
  );
  await audit(admin.id, `admin.${existing.type.toLowerCase()}_${action}`, "Transaction", id, { amount: existing.amount, note });
  return json({ transaction: tx });
});
