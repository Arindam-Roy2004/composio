import "server-only";
import { GuideSchema, toSummary, type Guide, type GuideSummary } from "@/lib/schema/guide.schema";
import { log } from "@/lib/log";
import { queryGuides, type GuideQuery, type GuideQueryResult } from "@/lib/guides/query";
import { library } from "@/lib/storage/library";
import { getRedis } from "@/lib/storage/redis";

const guideKey = (slug: string) => `guide:${slug}`;
const INDEX_KEY = "guides:index";
// Small per-guide summaries (slug → JSON), so listing never loads full guides.
const SUMMARIES_KEY = "guides:summaries";

export function isLibrarySlug(slug: string): boolean {
  return library().has(slug);
}

/** Library guides win: they are human-reviewed and cannot be overwritten by a generation. */
export async function getGuide(slug: string): Promise<Guide | null> {
  const lib = library().get(slug);
  if (lib) return lib;

  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<unknown>(guideKey(slug));
  if (raw == null) return null;
  // Re-validate on read: storage is a trust boundary too (schema drift, manual edits).
  const r = GuideSchema.safeParse(typeof raw === "string" ? JSON.parse(raw) : raw);
  if (!r.success) {
    log.warn("stored guide failed validation", { slug, issues: r.error.issues.length });
    return null;
  }
  return r.data;
}

export async function saveGuide(guide: Guide): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");
  const valid = GuideSchema.parse(guide);
  await redis.set(guideKey(valid.slug), JSON.stringify(valid)); // no TTL: links stay shareable
  await redis.zadd(INDEX_KEY, { score: Date.parse(valid.generatedAt), member: valid.slug });
  await redis.hset(SUMMARIES_KEY, { [valid.slug]: JSON.stringify(toSummary(valid)) });
}

let backfilled = false;

/** Summaries of every generated guide. Backfills guides saved before summaries existed (once per process). */
async function generatedSummaries(): Promise<GuideSummary[]> {
  const redis = getRedis();
  if (!redis) return [];
  const raw = (await redis.hgetall<Record<string, unknown>>(SUMMARIES_KEY)) ?? {};
  const out = new Map<string, GuideSummary>();
  for (const [slug, v] of Object.entries(raw)) {
    try {
      out.set(slug, (typeof v === "string" ? JSON.parse(v) : v) as GuideSummary);
    } catch {
      /* skip a corrupt row */
    }
  }

  if (!backfilled) {
    backfilled = true;
    const indexed = await redis.zrange<string[]>(INDEX_KEY, 0, -1);
    const missing = indexed.filter((slug) => !out.has(slug) && !isLibrarySlug(slug));
    for (let i = 0; i < missing.length; i += 50) {
      const chunk = missing.slice(i, i + 50);
      const guides = await redis.mget<unknown[]>(...chunk.map(guideKey));
      const rows: Record<string, string> = {};
      guides.forEach((g, j) => {
        const r = g == null ? null : GuideSchema.safeParse(typeof g === "string" ? JSON.parse(g) : g);
        if (r?.success) {
          const sum = toSummary(r.data);
          out.set(chunk[j]!, sum);
          rows[chunk[j]!] = JSON.stringify(sum);
        }
      });
      if (Object.keys(rows).length) await redis.hset(SUMMARIES_KEY, rows);
    }
    if (missing.length) log.info("backfilled guide summaries", { count: missing.length });
  }

  for (const slug of out.keys()) if (isLibrarySlug(slug)) out.delete(slug);
  return [...out.values()];
}

/** All summaries: library first, then generated. Cheap: one hash read, no full guides. */
export async function allSummaries(): Promise<GuideSummary[]> {
  return [...[...library().values()].map(toSummary), ...(await generatedSummaries())];
}

export async function searchGuides(query: GuideQuery): Promise<GuideQueryResult> {
  return queryGuides(await allSummaries(), query);
}

/** Library plus the most recent generated guides, for the sidebar, palette and landing page. */
export async function listGuides(recent = 12): Promise<{ library: GuideSummary[]; generated: GuideSummary[] }> {
  const lib = [...library().values()].map(toSummary);
  const generated = (await generatedSummaries()).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)).slice(0, recent);
  return { library: lib, generated };
}
