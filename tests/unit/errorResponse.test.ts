import { describe, expect, it, vi } from "vitest";
import { NotFoundError, RateLimitError, UpstreamError, ValidationError } from "@/lib/http/errors";
import { toErrorResponse } from "@/lib/http/errorResponse";

vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
const req = new Request("https://app.test/api/guides/x");

describe("toErrorResponse", () => {
  it("keeps the shape for operational 4xx errors", async () => {
    const res = toErrorResponse(new ValidationError("Validation failed", [{ field: "q", message: "bad" }]), req, { production: true });
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ success: false, message: "Validation failed", details: [{ field: "q", message: "bad" }] });
  });

  it("hides 500 messages and details in production", async () => {
    const res = toErrorResponse(new Error("db password is hunter2"), req, { production: true });
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toMatchObject({ success: false, message: "Internal server error" });
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(body.requestId).toBeTruthy();
  });

  it("hides upstream details in production", async () => {
    const body = await toErrorResponse(new UpstreamError("tavily", "Search failed"), req, { production: true }).json();
    expect(body.message).toBe("Internal server error");
    expect(body.details).toBeUndefined();
  });

  it("shows 500 messages in development", async () => {
    const body = await toErrorResponse(new Error("boom"), req, { production: false }).json();
    expect(body.message).toBe("Internal server error"); // non-AppError messages are never echoed
  });

  it("sets Retry-After for rate limits", () => {
    const res = toErrorResponse(new RateLimitError("slow down", 42), req);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
  });

  it("maps NotFoundError", () => expect(toErrorResponse(new NotFoundError(), req).status).toBe(404));

  it("logs 4xx at warn and 5xx at error", () => {
    toErrorResponse(new NotFoundError(), req);
    expect(console.warn).toHaveBeenCalled();
    toErrorResponse(new Error("x"), req);
    expect(console.error).toHaveBeenCalled();
  });
});
