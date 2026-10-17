import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Tx = Prisma.TransactionClient;

export const demoBalance = () => Number(process.env.DEMO_BALANCE ?? 10000) || 10000;

/** Every user gets one demo account (pre-funded) and one live account (funded via deposits). */
export async function createDefaultAccounts(tx: Tx, userId: string) {
  const demo = await tx.account.create({
    data: { userId, type: "DEMO", balance: demoBalance() },
  });
  await tx.transaction.create({
    data: { accountId: demo.id, type: "DEPOSIT", amount: demo.balance, method: "Demo funds", note: "Initial demo balance" },
  });
  await tx.account.create({ data: { userId, type: "LIVE", balance: 0 } });
}

export async function audit(actorId: string | null, action: string, entity?: string, entityId?: string, details?: unknown) {
  await prisma.auditLog.create({
    data: { actorId, action, entity, entityId, details: details === undefined ? null : JSON.stringify(details) },
  });
}
