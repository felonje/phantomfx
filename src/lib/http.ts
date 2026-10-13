import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return schema.parse(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function route<A extends any[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) {
        const issue = err.issues[0];
        const field = issue?.path?.join(".");
        return json({ error: field ? `${field}: ${issue.message}` : issue?.message ?? "Invalid input" }, { status: 400 });
      }
      console.error(err);
      return json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) throw new HttpError(429, "Too many attempts, please try again later");
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
