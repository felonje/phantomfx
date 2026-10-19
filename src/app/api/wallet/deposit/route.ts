import { z } from "zod";
import { requireVerifiedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, rateLimit, route } from "@/lib/http";
import { audit } from "@/server/accounts";
import { PAYMENT_METHODS } from "@/lib/payments";



const schema = z.object({
  amount: z.number().min(10, "Minimum deposit is $10").max(100_000),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().min(3, "Enter the payment reference / transaction code").max(100),
});

export const POST = route(async (req: Request) => {
  const user = await requireVerifiedUser();
  rateLimit(`deposit:${user.id}`, 20, 60 * 60 * 1000);
  const body = await parseBody(req, schema);
  const live = await prisma.account.findFirst({ where: { userId: user.id, type: "LIVE" } });
  if (!live) throw new HttpError(404, "Live account not found");
  const tx = await prisma.transaction.create({
    data: { accountId: live.id, type: "DEPOSIT", amount: body.amount, status: "PENDING", method: body.method, reference: body.reference },
  });
  await audit(user.id, "wallet.deposit_request", "Transaction", tx.id, body);
  return json({ transaction: tx });
});
