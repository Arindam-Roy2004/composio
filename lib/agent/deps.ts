import "server-only";
import { requireFeature } from "@/lib/env";
import { scrapePage, SEVEN_DAYS_MS } from "@/lib/integrations/contextDev";
import { tavilySearch } from "@/lib/integrations/tavily";
import { assertSafeUrl } from "@/lib/security/urlGuard";
import type { AgentDeps } from "@/lib/agent/state";

export function liveDeps(): AgentDeps {
  const e = requireFeature("agent");
  return {
    search: (query, signal) => tavilySearch(query, { apiKey: e.TAVILY_API_KEY!, signal }),
    scrape: (url, { html, timeoutMs, signal }) =>
      // Docs are cached for 7 days to save credits; console probes are fetched fresh.
      scrapePage(url, { apiKey: e.CONTEXT_DEV_API_KEY!, html, timeoutMs, signal, maxAgeMs: html ? 0 : SEVEN_DAYS_MS }),
    assertSafeUrl: (url) => assertSafeUrl(url),
  };
}
