import { tool } from "ai";
import { z } from "zod";
import { BUDGET, type AgentDeps, type RunState } from "@/lib/agent/state";
import { log } from "@/lib/log";

export const WebSearchInput = z.object({ query: z.string().min(2).max(200) });

export async function runSearch(state: RunState, deps: AgentDeps, query: string, signal?: AbortSignal) {
  const over = state.take("search");
  if (over) return { error: over };
  try {
    const s = signal ? AbortSignal.any([signal, AbortSignal.timeout(BUDGET.searchTimeoutMs)]) : AbortSignal.timeout(BUDGET.searchTimeoutMs);
    const results = await deps.search(query, s);
    state.searches.push({ query, results });
    state.emit({ type: "search", query, results: results.length });
    return { results };
  } catch (err) {
    log.warn("webSearch failed", { error: err instanceof Error ? err.message : String(err) });
    state.emit({ type: "search", query, results: 0 });
    return { error: "Search failed. Try a different query or read a page you already found." };
  }
}

export const webSearchTool = (state: RunState, deps: AgentDeps) =>
  tool({
    description: "Search the web. Returns up to 5 results with title, url and snippet. Prefer queries that target the provider's official developer docs.",
    inputSchema: WebSearchInput,
    execute: async ({ query }, { abortSignal }) => runSearch(state, deps, query, abortSignal),
  });
