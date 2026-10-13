import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, parseBody, route } from "@/lib/http";
import { round2 } from "@/lib/trading/math";
import { audit } from "@/server/accounts";
import { withLock } from "@/server/lock";

const schema = z.object({ amount: z.number().refine((n) => n !== 0, "Amount cannot be zero"), note: z.string().trim().min(3).max(300) });

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);
  const amount = round2(body.amount);
  const account = await withLock(id, () =>
    prisma.$transaction(async (db) => {
      await db.transaction.create({
        data: { accountId: id, type: "ADJUSTMENT", amount, note: body.note, processedById: admin.id, processedAt: new Date() },
      });
      return db.account.update({ where: { id }, data: { balance: { increment: amount } } });
    }),
  );
  await audit(admin.id, "admin.balance_adjust", "Account", id, { amount, note: body.note });
  return json({ account });
});
