import "server-only";
import { GuideSchema, toSummary, type Guide, type GuideSummary } from "@/lib/schema/guide.schema";
import { log } from "@/lib/log";
import { library } from "@/lib/storage/library";
import { getRedis } from "@/lib/storage/redis";

const guideKey = (slug: string) => `guide:${slug}`;
const INDEX_KEY = "guides:index";
const LIST_LIMIT = 60;

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
}

export async function listGuides(): Promise<{ library: GuideSummary[]; generated: GuideSummary[] }> {
  const lib = [...library().values()].map(toSummary);
  const redis = getRedis();
  if (!redis) return { library: lib, generated: [] };

  const slugs = (await redis.zrange<string[]>(INDEX_KEY, 0, LIST_LIMIT - 1, { rev: true })).filter((s) => !isLibrarySlug(s));
  if (!slugs.length) return { library: lib, generated: [] };
  const raws = await redis.mget<unknown[]>(...slugs.map(guideKey));
  const generated: GuideSummary[] = [];
  for (const raw of raws) {
    if (raw == null) continue;
    const r = GuideSchema.safeParse(typeof raw === "string" ? JSON.parse(raw) : raw);
    if (r.success) generated.push(toSummary(r.data));
  }
  return { library: lib, generated };
}
