import { describe, expect, it, vi } from "vitest";
import { parseSse } from "@/lib/client/sse";
import { createSseResponse } from "@/lib/http/sse";
import type { AgentEvent } from "@/lib/schema/events.schema";

vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

async function collect(res: Response) {
  const out: AgentEvent[] = [];
  for await (const e of parseSse(res.body!)) out.push(e);
  return out;
}

describe("SSE", () => {
  it("round-trips validated events and sets stream headers", async () => {
    const res = createSseResponse(async (w) => {
      w.send({ type: "stage", stage: "research", status: "start" });
      w.send({ type: "guide_ready", slug: "x", url: "/guide/x", cached: false });
    });
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(await collect(res)).toEqual([
      { type: "stage", stage: "research", status: "start" },
      { type: "guide_ready", slug: "x", url: "/guide/x", cached: false },
    ]);
  });

  it("drops events that don't match the protocol", async () => {
    const res = createSseResponse(async (w) => {
      w.send({ type: "error", message: "x".repeat(5000), retryable: true } as AgentEvent);
      w.send({ type: "secret", key: "sk-live" } as unknown as AgentEvent);
    });
    const text = await res.text();
    expect(text).not.toContain("sk-live");
    expect(text).not.toContain("event: error");
  });

  it("turns a crash into a user-safe error event", async () => {
    const res = createSseResponse(async () => {
      throw new Error("db password hunter2");
    });
    const events = await collect(res);
    expect(events).toEqual([{ type: "error", message: expect.not.stringContaining("hunter2"), retryable: true }]);
  });
});
