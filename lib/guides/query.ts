import { z } from "zod";
import type { GuideSummary } from "@/lib/schema/guide.schema";

export const SOURCES = ["all", "library", "agent"] as const;
export const LEVELS = ["easy", "moderate", "hard", "gated", "unknown"] as const;
export const SORTS = ["easiest", "hardest", "newest", "az"] as const;
export type Source = (typeof SOURCES)[number];
export type Level = (typeof LEVELS)[number];
export type Sort = (typeof SORTS)[number];

export const PAGE_SIZE = 24;

export const SORT_LABEL: Record<Sort, string> = {
  easiest: "Easiest first",
  hardest: "Hardest first",
  newest: "Newest first",
  az: "A to Z",
};

export const GuideQuerySchema = z
  .object({
    q: z
      .string()
      .max(80)
      .transform((v) => v.normalize("NFKC").replace(/[^\p{L}\p{N} .\-_&+'()]/gu, "").trim())
      .default(""),
    source: z.enum(SOURCES).default("all"),
    difficulty: z.enum(["any", ...LEVELS]).default("any"),
    sort: z.enum(SORTS).default("easiest"),
    offset: z.coerce.number().int().min(0).max(100_000).default(0),
    limit: z.coerce.number().int().min(1).max(48).default(PAGE_SIZE),
  })
  .strict();

export type GuideQuery = z.infer<typeof GuideQuerySchema>;

export type GuideQueryResult = {
  items: GuideSummary[];
  total: number;
  nextOffset: number | null;
  facets: { source: Record<Source, number>; difficulty: Record<Level, number> };
};

const RANK: Record<Level, number> = { easy: 1, moderate: 2, hard: 3, gated: 4, unknown: 5 };

const COMPARE: Record<Sort, (a: GuideSummary, b: GuideSummary) => number> = {
  easiest: (a, b) => RANK[a.difficulty] - RANK[b.difficulty] || a.appName.localeCompare(b.appName),
  // "Not rated" sorts last in both directions.
  hardest: (a, b) => (RANK[b.difficulty] % 5) - (RANK[a.difficulty] % 5) || a.appName.localeCompare(b.appName),
  newest: (a, b) => b.generatedAt.localeCompare(a.generatedAt) || a.appName.localeCompare(b.appName),
  az: (a, b) => a.appName.localeCompare(b.appName),
};

const matchesText = (g: GuideSummary, needle: string) => !needle || `${g.appName} ${g.category} ${g.slug}`.toLowerCase().includes(needle);
const matchesSource = (g: GuideSummary, s: Source) => s === "all" || g.generatedBy === s;
const matchesLevel = (g: GuideSummary, d: GuideQuery["difficulty"]) => d === "any" || g.difficulty === d;

/**
 * Filter, count and page a list of summaries. Facet counts follow the usual rule: each facet's
 * counts respect every other active filter but not its own, so switching a filter never shows 0s
 * for options that would have results.
 */
export function queryGuides(all: GuideSummary[], query: GuideQuery): GuideQueryResult {
  const needle = query.q.toLowerCase();
  const textMatched = all.filter((g) => matchesText(g, needle));

  const source = { all: 0, library: 0, agent: 0 } as Record<Source, number>;
  for (const g of textMatched) {
    if (!matchesLevel(g, query.difficulty)) continue;
    source.all++;
    source[g.generatedBy]++;
  }
  const difficulty = { easy: 0, moderate: 0, hard: 0, gated: 0, unknown: 0 } as Record<Level, number>;
  for (const g of textMatched) if (matchesSource(g, query.source)) difficulty[g.difficulty]++;

  const filtered = textMatched.filter((g) => matchesSource(g, query.source) && matchesLevel(g, query.difficulty)).sort(COMPARE[query.sort]);
  const items = filtered.slice(query.offset, query.offset + query.limit);
  const end = query.offset + items.length;
  return { items, total: filtered.length, nextOffset: end < filtered.length ? end : null, facets: { source, difficulty } };
}
