import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, parseBody, route } from "@/lib/http";
import { audit } from "@/server/accounts";
import { reloadInstruments } from "@/server/instrumentCache";

export const GET = route(async () => {
  await requireAdmin();
  return json({ instruments: await prisma.instrument.findMany({ orderBy: { sort: "asc" } }) });
});

const schema = z.object({
  symbol: z.string(),
  spreadPips: z.number().min(0).max(100).optional(),
  commissionPerLot: z.number().min(0).max(100).optional(),
  minLot: z.number().min(0.01).max(100).optional(),
  maxLot: z.number().min(0.01).max(1000).optional(),
  enabled: z.boolean().optional(),
});

export const PATCH = route(async (req: Request) => {
  const admin = await requireAdmin();
  const { symbol, ...data } = await parseBody(req, schema);
  const instrument = await prisma.instrument.update({ where: { symbol }, data });
  await reloadInstruments();
  await audit(admin.id, "admin.instrument_update", "Instrument", symbol, data);
  return json({ instrument });
});
