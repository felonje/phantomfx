import { marketOpen, priceFeed, type Tick } from "@/server/prices";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (ticks: Tick[]) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ ticks, mode: priceFeed.mode, marketOpen: marketOpen() })}\n\n`),
        );
      const onTicks = (ticks: Tick[]) => {
        try {
          send(ticks);
        } catch {
          cleanup();
        }
      };
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          cleanup();
        }
      }, 15_000);
      cleanup = () => {
        priceFeed.off("ticks", onTicks);
        clearInterval(ping);
      };
      priceFeed.on("ticks", onTicks);
      send(priceFeed.ticks());
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
