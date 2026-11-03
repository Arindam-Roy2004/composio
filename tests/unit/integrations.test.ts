import { describe, expect, it, vi } from "vitest";
import { ContextDevError, scrapePage } from "@/lib/integrations/contextDev";
import { tavilySearch } from "@/lib/integrations/tavily";

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
const noSleep = async () => {};

describe("contextDev.scrapePage", () => {
  const ok = { markdown: { data: "# Hello", success: true }, metadata: { title: "Docs" }, url: "https://x.test/final", request_id: "r1" };

  it("sends bearer auth and the markdown request, and maps the response", async () => {
    const fetchImpl = vi.fn(async () => json(200, ok));
    const r = await scrapePage("https://x.test/docs", { apiKey: "k-test", fetchImpl, sleep: noSleep });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.context.dev/v1/web/scrape");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer k-test");
    expect(JSON.parse(init.body as string)).toMatchObject({ url: "https://x.test/docs", formats: { markdown: true, html: false } });
    expect(r).toMatchObject({ markdown: "# Hello", title: "Docs", finalUrl: "https://x.test/final", requestId: "r1" });
  });

  it("retries once on 429 then succeeds", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json(429, {}, { "retry-after": "1" })).mockResolvedValueOnce(json(200, ok));
    await expect(scrapePage("https://x.test", { apiKey: "k", fetchImpl, sleep: noSleep })).resolves.toMatchObject({ markdown: "# Hello" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up after two 5xx and never leaks the upstream body", async () => {
    const fetchImpl = vi.fn(async () => json(503, { error_code: "UPSTREAM", message: "secret internals" }));
    const err = await scrapePage("https://x.test", { apiKey: "k", fetchImpl, sleep: noSleep }).catch((e) => e);
    expect(err).toBeInstanceOf(ContextDevError);
    expect(err.message).not.toContain("secret internals");
    expect(err.statusCode).toBe(502);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry 4xx", async () => {
    const fetchImpl = vi.fn(async () => json(400, { error_code: "BAD_URL" }));
    await expect(scrapePage("https://x.test", { apiKey: "k", fetchImpl, sleep: noSleep })).rejects.toThrow(/BAD_URL/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("treats empty markdown as an error", async () => {
    const fetchImpl = vi.fn(async () => json(200, { markdown: { data: "  " } }));
    await expect(scrapePage("https://x.test", { apiKey: "k", fetchImpl, sleep: noSleep })).rejects.toThrow(/no readable content/);
  });

  it("refuses to run without a key", async () => {
    await expect(scrapePage("https://x.test", { apiKey: "", fetchImpl: vi.fn() })).rejects.toThrow(/not configured/);
  });
});

describe("tavilySearch", () => {
  it("returns top results, dropping non-https URLs and trimming snippets", async () => {
    const fetchImpl = vi.fn(async () =>
      json(200, {
        results: [
          { title: "A", url: "https://a.test", content: "x".repeat(900) },
          { title: "B", url: "http://b.test", content: "b" },
          { title: "C", url: "https://c.test" },
        ],
      }),
    );
    const r = await tavilySearch("q", { apiKey: "tv", fetchImpl, sleep: noSleep });
    expect(r.map((x) => x.url)).toEqual(["https://a.test", "https://c.test"]);
    expect(r[0]!.snippet).toHaveLength(500);
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tv");
  });

  it("tolerates a malformed body", async () => {
    const fetchImpl = vi.fn(async () => json(200, { results: "nope" }));
    await expect(tavilySearch("q", { apiKey: "tv", fetchImpl, sleep: noSleep })).resolves.toEqual([]);
  });

  it("retries once on 5xx and maps failure to UpstreamError", async () => {
    const fetchImpl = vi.fn(async () => json(500, {}));
    await expect(tavilySearch("q", { apiKey: "tv", fetchImpl, sleep: noSleep })).rejects.toMatchObject({ statusCode: 502, provider: "tavily" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
