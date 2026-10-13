import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, json, parseBody, route } from "@/lib/http";
import { modifyPosition } from "@/server/trading";

const schema = z.object({ stopLoss: z.number().positive().nullish(), takeProfit: z.number().positive().nullish() });

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);
  const pos = await prisma.position.findFirst({ where: { id, account: { userId: user.id } } });
  if (!pos) throw new HttpError(404, "Position not found");
  return json({ position: await modifyPosition(id, pos.accountId, body.stopLoss ?? null, body.takeProfit ?? null) });
});
