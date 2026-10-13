import { z } from "zod";
import { requireOwnAccount, requireUser } from "@/lib/auth";
import { json, parseBody, route } from "@/lib/http";
import { placeOrder } from "@/server/trading";

const optionalPrice = z.number().positive().nullish();

const schema = z.object({
  accountId: z.string().min(1),
  symbol: z.string().min(6).max(10),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT", "STOP"]),
  volume: z.number().positive(),
  price: optionalPrice,
  stopLoss: optionalPrice,
  takeProfit: optionalPrice,
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const body = await parseBody(req, schema);
  await requireOwnAccount(user.id, body.accountId);
  return json(await placeOrder(body.accountId, body));
});
