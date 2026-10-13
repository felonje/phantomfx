import { z } from "zod";
import { requireOwnAccount, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, route } from "@/lib/http";
import { LEVERAGE_OPTIONS } from "@/lib/instruments";
import { withLock } from "@/server/lock";
import { getAccountState } from "@/server/trading";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await requireOwnAccount(user.id, id);
  return json(await getAccountState(id));
});

const patchSchema = z.object({ leverage: z.number().int() });

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await requireOwnAccount(user.id, id);
  const { leverage } = await parseBody(req, patchSchema);
  if (!LEVERAGE_OPTIONS.includes(leverage)) throw new HttpError(400, "Unsupported leverage");
  const account = await withLock(id, async () => {
    const open = await prisma.position.count({ where: { accountId: id, status: "OPEN" } });
    if (open > 0) throw new HttpError(400, "Close all positions before changing leverage");
    return prisma.account.update({ where: { id }, data: { leverage } });
  });
  return json({ account });
});
