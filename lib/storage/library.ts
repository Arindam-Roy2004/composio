import { LIBRARY_RAW } from "@/data/guides";
import { GuideSchema, type Guide } from "@/lib/schema/guide.schema";

function load(): Map<string, Guide> {
  const map = new Map<string, Guide>();
  for (const [file, raw] of Object.entries(LIBRARY_RAW)) {
    const r = GuideSchema.safeParse(raw);
    if (!r.success) {
      // Fail loudly: a broken library guide must never ship.
      throw new Error(`Library guide "${file}" is invalid: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    }
    if (r.data.slug !== file) throw new Error(`Library guide "${file}" has mismatched slug "${r.data.slug}"`);
    map.set(r.data.slug, r.data);
  }
  return map;
}

let cache: Map<string, Guide> | null = null;

export function library(): Map<string, Guide> {
  cache ??= load();
  return cache;
}
