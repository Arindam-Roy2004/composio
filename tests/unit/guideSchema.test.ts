import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIBRARY_RAW } from "@/data/guides";
import { checkGuideConsistency } from "@/lib/agent/verify";
import { clampToGuide, GuideSchema } from "@/lib/schema/guide.schema";
import { baseGuide } from "./fixtures";

const dir = join(process.cwd(), "data/guides");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

describe("library guides", () => {
  it("has at least one guide", () => expect(files.length).toBeGreaterThan(0));

  it.each(files)("%s parses, is registered, and passes verification unchanged", (file) => {
    const r = GuideSchema.safeParse(JSON.parse(readFileSync(join(dir, file), "utf8")));
    if (!r.success) throw new Error(JSON.stringify(r.error.issues, null, 2));
    expect(r.data.slug).toBe(file.replace(/\.json$/, ""));
    expect(LIBRARY_RAW).toHaveProperty(r.data.slug);
    expect(checkGuideConsistency(r.data)).toEqual([]);
  });
});

describe("GuideSchema", () => {
  it("rejects a malformed guide", () => {
    const g = baseGuide() as Record<string, unknown>;
    delete g.steps;
    expect(GuideSchema.safeParse(g).success).toBe(false);
  });

  it("rejects unknown top-level keys", () => {
    expect(GuideSchema.safeParse({ ...baseGuide(), html: "<b>x</b>" }).success).toBe(false);
  });

  it("rejects non-https source URLs", () => {
    const g = baseGuide();
    g.sources[0]!.url = "javascript:alert(1)";
    expect(GuideSchema.safeParse(g).success).toBe(false);
    g.sources[0]!.url = "http://docs.github.com/x";
    expect(GuideSchema.safeParse(g).success).toBe(false);
  });

  it("enforces length caps", () => {
    const g = baseGuide();
    g.steps[0]!.title = "x".repeat(121);
    expect(GuideSchema.safeParse(g).success).toBe(false);
  });
});

describe("clampToGuide", () => {
  it("trims long strings and arrays and drops bad optional URLs", () => {
    const g = baseGuide();
    g.steps[0]!.title = "x".repeat(500);
    g.unknowns = Array.from({ length: 20 }, (_, i) => `u${i}`);
    (g.steps[1] as { url?: string }).url = "not a url";
    const r = clampToGuide(g);
    if (!r.success) throw new Error(JSON.stringify(r.error.issues));
    expect(r.data.steps[0]!.title).toHaveLength(120);
    expect(r.data.unknowns).toHaveLength(8);
    expect(r.data.steps[1]!.url).toBeUndefined();
  });

  it("still fails on structural errors", () => {
    const g = baseGuide() as Record<string, unknown>;
    g.oauthSupport = "magic";
    expect(clampToGuide(g).success).toBe(false);
  });
});
