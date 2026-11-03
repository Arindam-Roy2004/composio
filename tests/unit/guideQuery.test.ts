import { describe, expect, it } from "vitest";
import { GuideSearchDto } from "@/lib/dto/guide-search.dto";
import { GuideQuerySchema, queryGuides } from "@/lib/guides/query";
import type { GuideSummary } from "@/lib/schema/guide.schema";

const mk = (i: number, over: Partial<GuideSummary> = {}): GuideSummary => ({
  slug: `app-${i}`,
  appName: `App ${String(i).padStart(3, "0")}`,
  website: `https://app${i}.test`,
  category: i % 2 ? "Email" : "CRM",
  generatedBy: i % 3 ? "agent" : "library",
  generatedAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
  oauthSupport: "oauth2",
  difficulty: (["easy", "moderate", "hard", "gated", "unknown"] as const)[i % 5],
  oneLiner: "x",
  activeSetup: { minMinutes: 5, maxMinutes: 10 },
  approval: "no",
  approvalDays: { minDays: 0, maxDays: 0 },
  ...over,
});

const data = Array.from({ length: 100 }, (_, i) => mk(i));
const q = (over: Record<string, unknown> = {}) => GuideQuerySchema.parse(over);

describe("queryGuides", () => {
  it("pages 24 at a time with a next offset until the end", () => {
    const p1 = queryGuides(data, q());
    expect(p1.items).toHaveLength(24);
    expect(p1.total).toBe(100);
    expect(p1.nextOffset).toBe(24);
    const last = queryGuides(data, q({ offset: 96 }));
    expect(last.items).toHaveLength(4);
    expect(last.nextOffset).toBeNull();
  });

  it("filters by source and difficulty and searches name/category", () => {
    const r = queryGuides(data, q({ source: "library", difficulty: "easy", limit: 48 }));
    expect(r.items.every((g) => g.generatedBy === "library" && g.difficulty === "easy")).toBe(true);
    expect(queryGuides(data, q({ q: "crm", limit: 48 })).total).toBe(50);
    expect(queryGuides(data, q({ q: "App 007" })).items.map((g) => g.slug)).toEqual(["app-7"]);
  });

  it("facet counts ignore their own filter but respect the others", () => {
    const r = queryGuides(data, q({ source: "library", difficulty: "hard" }));
    // difficulty counts are within the library source
    expect(Object.values(r.facets.difficulty).reduce((a, b) => a + b, 0)).toBe(data.filter((g) => g.generatedBy === "library").length);
    // source counts are within the hard difficulty
    expect(r.facets.source.all).toBe(data.filter((g) => g.difficulty === "hard").length);
  });

  it("sorts easiest first with unrated last, and newest first", () => {
    const easiest = queryGuides(data, q({ limit: 48 })).items;
    expect(easiest[0]!.difficulty).toBe("easy");
    const hardest = queryGuides(data, q({ sort: "hardest", offset: 96 })).items;
    expect(hardest.at(-1)!.difficulty).toBe("unknown");
    expect(queryGuides(data, q({ sort: "newest" })).items[0]!.slug).toBe("app-99");
  });
});

describe("GuideSearchDto", () => {
  it("coerces query-string numbers and strips odd characters", () => {
    const r = GuideSearchDto.validate({ q: "<b>slack</b>", offset: "24", limit: "12" });
    expect(r.value).toMatchObject({ q: "bslackb", offset: 24, limit: 12, source: "all", sort: "easiest" });
  });
  it("rejects unknown keys and out-of-range limits", () => {
    expect(GuideSearchDto.validate({ page: "2" }).errors).not.toBeNull();
    expect(GuideSearchDto.validate({ limit: "500" }).errors?.[0]?.field).toBe("limit");
  });
});
