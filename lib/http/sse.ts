import { AgentEventSchema, type AgentEvent } from "@/lib/schema/events.schema";
import { log } from "@/lib/log";

export const HEARTBEAT_MS = 15_000;

export type SseWriter = {
  send(event: AgentEvent): void;
  close(): void;
  readonly closed: boolean;
};

/**
 * Creates a text/event-stream Response. Every event is validated against AgentEventSchema before
 * it is written, so nothing outside the protocol (stack traces, keys, upstream bodies) can leak.
 */
export function createSseResponse(
  run: (writer: SseWriter) => Promise<void>,
  opts: { signal?: AbortSignal; headers?: HeadersInit } = {},
): Response {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const enqueue = (chunk: string) => {
    if (closed || !controllerRef) return;
    try {
      controllerRef.enqueue(encoder.encode(chunk));
    } catch {
      closed = true;
    }
  };

  const writer: SseWriter = {
    send(event) {
      const parsed = AgentEventSchema.safeParse(event);
      if (!parsed.success) {
        log.warn("dropped invalid SSE event", { type: (event as { type?: string }).type, issues: parsed.error.issues.length });
        return;
      }
      enqueue(`event: ${parsed.data.type}\ndata: ${JSON.stringify(parsed.data)}\n\n`);
    },
    close() {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      try {
        controllerRef?.close();
      } catch {
        /* already closed */
      }
    },
    get closed() {
      return closed;
    },
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
      enqueue(": connected\n\n");
      heartbeat = setInterval(() => enqueue(`: heartbeat ${Date.now()}\n\n`), HEARTBEAT_MS);
      opts.signal?.addEventListener("abort", () => writer.close(), { once: true });
      run(writer)
        .catch((err) => {
          log.error("sse run failed", { error: err instanceof Error ? err.message : String(err) });
          writer.send({ type: "error", message: "Something went wrong while generating this guide.", retryable: true });
        })
        .finally(() => writer.close());
    },
    cancel() {
      closed = true;
      clearInterval(heartbeat);
    },
  });

  const headers = new Headers(opts.headers);
  headers.set("content-type", "text/event-stream; charset=utf-8");
  headers.set("cache-control", "no-cache, no-transform");
  headers.set("connection", "keep-alive");
  headers.set("x-accel-buffering", "no");
  return new Response(stream, { headers });
}
