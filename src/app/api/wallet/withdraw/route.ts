import { z } from "zod";
import { requireVerifiedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, rateLimit, route } from "@/lib/http";
import { round2 } from "@/lib/trading/math";
import { audit } from "@/server/accounts";
import { PAYMENT_METHODS } from "@/lib/payments";
import { withLock } from "@/server/lock";
import { getAccountState } from "@/server/trading";

const schema = z.object({
  amount: z.number().min(10, "Minimum withdrawal is $10"),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().min(3, "Enter your payout details (phone, account or wallet)").max(200),
});

export const POST = route(async (req: Request) => {
  const user = await requireVerifiedUser();
  rateLimit(`withdraw:${user.id}`, 10, 60 * 60 * 1000);
  const body = await parseBody(req, schema);
  const amount = round2(body.amount);
  const live = await prisma.account.findFirst({ where: { userId: user.id, type: "LIVE" } });
  if (!live) throw new HttpError(404, "Live account not found");
  // Funds are reserved (debited) immediately and refunded if the request is rejected.
  const tx = await withLock(live.id, async () => {
    const state = await getAccountState(live.id);
    const available = Math.min(state.metrics.freeMargin, state.account.balance);
    if (amount > available) throw new HttpError(400, `Insufficient withdrawable funds ($${available.toFixed(2)} available)`);
    return prisma.$transaction(async (db) => {
      await db.account.update({ where: { id: live.id }, data: { balance: { decrement: amount } } });
      return db.transaction.create({
        data: { accountId: live.id, type: "WITHDRAWAL", amount: -amount, status: "PENDING", method: body.method, reference: body.reference },
      });
    });
  });
  await audit(user.id, "wallet.withdraw_request", "Transaction", tx.id, body);
  return json({ transaction: tx });
});
