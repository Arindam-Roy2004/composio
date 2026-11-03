import { z } from "zod";
import { UpstreamError } from "@/lib/http/errors";

const ENDPOINT = "https://api.tavily.com/search";
const MAX_ATTEMPTS = 2;

export type SearchResult = { title: string; url: string; snippet: string };

export type SearchOptions = {
  apiKey: string;
  maxResults?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

// Validate the upstream response: third-party JSON is untrusted input.
const ResponseSchema = z.object({
  results: z
    .array(z.object({ title: z.string().catch(""), url: z.string(), content: z.string().catch("") }))
    .catch([]),
});

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function tavilySearch(query: string, opts: SearchOptions): Promise<SearchResult[]> {
  const { apiKey, maxResults = 5, timeoutMs = 10_000, fetchImpl = fetch, sleep = defaultSleep } = opts;
  if (!apiKey) throw new UpstreamError("tavily", "Search is not configured");
  const signal = opts.signal ? AbortSignal.any([opts.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);

  let res: Response | undefined;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, max_results: maxResults, search_depth: "basic", include_answer: false }),
        signal,
      });
    } catch {
      if (attempt < MAX_ATTEMPTS && !signal.aborted) {
        await sleep(500);
        continue;
      }
      throw new UpstreamError("tavily", signal.aborted ? "Search timed out" : "Could not reach search");
    }
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS) {
      await sleep(1000);
      continue;
    }
    break;
  }

  if (!res.ok) throw new UpstreamError("tavily", `Search failed (HTTP ${res.status})`, res.status);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new UpstreamError("tavily", "Search returned invalid JSON");
  }
  return ResponseSchema.parse(json)
    .results.filter((r) => /^https:\/\//i.test(r.url))
    .slice(0, maxResults)
    .map((r) => ({ title: r.title.slice(0, 200), url: r.url, snippet: r.content.slice(0, 500) }));
}
