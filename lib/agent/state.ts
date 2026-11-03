import type { AgentEvent } from "@/lib/schema/events.schema";
import type { Source } from "@/lib/schema/guide.schema";
import type { SearchResult } from "@/lib/integrations/tavily";
import type { ScrapeResult } from "@/lib/integrations/contextDev";
import type { ProbeObservation } from "@/lib/agent/probe";
import { classifySource, hostOf } from "@/lib/agent/sources";

export const BUDGET = {
  maxToolCalls: 10, // webSearch + readPage + probeConsole, across all phases
  maxPages: 6, // readPage fetches
  reservedForProbe: 2, // tool calls held back during research so Phase 3 always runs
  maxNotes: 40,
  maxConsoleProbes: 2,
  searchTimeoutMs: 10_000,
  scrapeTimeoutMs: 45_000,
  probeTimeoutMs: 20_000,
  runDeadlineMs: 120_000,
  researchDeadlineMs: 70_000, // leave room for probe + synthesis inside the run deadline
} as const;

export type Note = { claim: string; sourceUrl: string; quote: string };

export type AgentDeps = {
  search: (query: string, signal: AbortSignal) => Promise<SearchResult[]>;
  scrape: (url: string, opts: { html: boolean; timeoutMs: number; signal: AbortSignal }) => Promise<ScrapeResult>;
  assertSafeUrl: (url: string) => Promise<URL>;
  now?: () => number;
};

const normUrl = (u: string) => u.replace(/#.*$/, "").replace(/\/$/, "");

export class RunState {
  toolCalls = 0;
  pagesRead = 0;
  probesRun = 0;
  phase: "research" | "probe" | "other" = "other";
  readonly notes: Note[] = [];
  readonly sources = new Map<string, Source>(); // normalised url → source
  readonly probedUrls = new Set<string>();
  readonly probes: ProbeObservation[] = [];
  readonly consoleCandidates: string[] = [];
  readonly searches: { query: string; results: SearchResult[] }[] = [];
  officialDomains = new Set<string>();

  constructor(
    readonly slug: string,
    readonly appName: string,
    readonly emit: (e: AgentEvent) => void,
    readonly startedAt: number,
  ) {}

  /** Reserves one tool call (and optionally a page read). Returns an error string if over budget. */
  take(kind: "search" | "page" | "probe"): string | null {
    const cap = this.phase === "research" ? BUDGET.maxToolCalls - BUDGET.reservedForProbe : BUDGET.maxToolCalls;
    if (this.toolCalls >= cap) return "Tool budget exhausted. Stop researching and summarise what you have.";
    if (kind === "page" && this.pagesRead >= BUDGET.maxPages) return "Page-read budget exhausted. Use what you have already read.";
    if (kind === "probe" && this.probesRun >= BUDGET.maxConsoleProbes) return "Probe budget exhausted.";
    this.toolCalls++;
    if (kind === "page") this.pagesRead++;
    if (kind === "probe") this.probesRun++;
    this.emit({
      type: "budget",
      toolCalls: this.toolCalls,
      maxToolCalls: BUDGET.maxToolCalls,
      pagesRead: this.pagesRead,
      maxPages: BUDGET.maxPages,
    });
    return null;
  }

  /** True once research can make no further progress. */
  get researchExhausted(): boolean {
    return this.toolCalls >= BUDGET.maxToolCalls - BUDGET.reservedForProbe;
  }

  hasFetched(url: string): boolean {
    return this.sources.has(normUrl(url));
  }

  /** Registers a page we actually fetched. Only fetched pages can ever become guide sources. */
  addSource(page: ScrapeResult, requestedUrl: string, opts: { probed?: boolean } = {}): Source {
    const key = normUrl(requestedUrl);
    const existing = this.sources.get(key);
    const kind = classifySource(requestedUrl, { officialDomains: this.officialDomains, slug: this.slug, probed: opts.probed });
    if (existing) {
      if (opts.probed) existing.kind = "console";
      return existing;
    }
    const source: Source = {
      id: `s${this.sources.size + 1}`,
      url: requestedUrl,
      title: (page.title ?? hostOf(requestedUrl)).slice(0, 200) || hostOf(requestedUrl),
      kind,
      fetchedAt: new Date().toISOString(),
    };
    this.sources.set(key, source);
    // The final URL after redirects counts as fetched too (same content).
    if (page.finalUrl && normUrl(page.finalUrl) !== key && !this.sources.has(normUrl(page.finalUrl))) {
      this.sources.set(normUrl(page.finalUrl), source);
    }
    return source;
  }

  sourceFor(url: string): Source | undefined {
    return this.sources.get(normUrl(url));
  }

  uniqueSources(): Source[] {
    return [...new Set(this.sources.values())];
  }

  fetchedUrlSet(): Set<string> {
    return new Set(this.uniqueSources().map((s) => s.url));
  }
}

export { normUrl };
