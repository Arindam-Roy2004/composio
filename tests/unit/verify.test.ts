import { describe, expect, it } from "vitest";
import { verifyGuide } from "@/lib/agent/verify";
import { baseGuide } from "./fixtures";

const fetchedAll = (g: ReturnType<typeof baseGuide>) => new Set(g.sources.map((s) => s.url));

describe("verifyGuide", () => {
  it("passes a consistent guide unchanged", () => {
    const g = baseGuide();
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g) });
    expect(r.downgraded).toBe(0);
    expect(r.notes).toEqual([]);
  });

  it("downgrades a claim whose only sourceId is unknown", () => {
    const g = baseGuide();
    g.nuances[0]!.sourceIds = ["s99"];
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g) });
    expect(r.guide.nuances[0]!.evidence).toBe("uncertain");
    expect(r.guide.nuances[0]!.sourceIds).toEqual([]);
    expect(r.guide.unknowns.some((u) => u.includes(g.nuances[0]!.title))).toBe(true);
  });

  it("downgrades documented → community when only a community source is cited", () => {
    const g = baseGuide();
    g.sources.push({ id: "s9", url: "https://stackoverflow.com/q/1", title: "SO", kind: "community" });
    g.scopes[0]!.sourceIds = ["s9"];
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g) });
    expect(r.guide.scopes[0]!.evidence).toBe("community");
    expect(r.downgraded).toBe(1);
  });

  it("flags easy + always-review and bumps difficulty", () => {
    const g = baseGuide();
    g.time.approvalWait.required = "always";
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g) });
    expect(r.guide.verdict.difficulty).toBe("moderate");
    expect(r.notes.join()).toMatch(/easy → moderate/);
  });

  it("drops sources not fetched this run and downgrades claims that relied on them", () => {
    const g = baseGuide();
    const fetched = new Set([g.sources[0]!.url]);
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetched });
    expect(r.guide.sources).toHaveLength(1);
    const handleRefresh = r.guide.steps.find((s) => s.id === "handle-refresh")!;
    expect(handleRefresh.evidence).toBe("uncertain");
  });

  it("never lets the agent mark something tested", () => {
    const g = baseGuide();
    g.steps[0]!.evidence = "tested";
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g) });
    expect(r.guide.steps[0]!.evidence).toBe("documented");
  });

  it("requires a probed console page for probed evidence", () => {
    const g = baseGuide();
    g.sources.push({ id: "s8", url: "https://github.com/settings/applications/new", title: "Console", kind: "console" });
    g.steps[1]!.evidence = "probed";
    g.steps[1]!.sourceIds = ["s8"];
    const fetched = fetchedAll(g);
    expect(verifyGuide(g, { mode: "agent", fetchedUrls: fetched, probedUrls: new Set() }).guide.steps[1]!.evidence).not.toBe("probed");
    expect(
      verifyGuide(g, { mode: "agent", fetchedUrls: fetched, probedUrls: new Set(["https://github.com/settings/applications/new"]) }).guide.steps[1]!.evidence,
    ).toBe("probed");
  });

  it("fixes inverted and absurd time ranges", () => {
    const g = baseGuide();
    g.time.activeSetup.minMinutes = 30;
    g.time.activeSetup.maxMinutes = 5;
    g.time.approvalWait = { ...g.time.approvalWait, required: "always", minDays: 10, maxDays: 900 };
    g.verdict.difficulty = "hard";
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g) });
    expect(r.guide.time.activeSetup).toMatchObject({ minMinutes: 5, maxMinutes: 30 });
    expect(r.guide.time.approvalWait).toMatchObject({ minDays: null, maxDays: null, evidence: "uncertain" });
  });

  it("removes approval timelines with no source", () => {
    const g = baseGuide();
    g.verdict.difficulty = "hard";
    g.time.approvalWait = { ...g.time.approvalWait, required: "for_some_scopes", minDays: 3, maxDays: 7, sourceIds: [], evidence: "documented" };
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g) });
    expect(r.guide.time.approvalWait).toMatchObject({ minDays: null, maxDays: null, evidence: "uncertain" });
  });

  it("rejects citations of pages the agent never took notes from", () => {
    const g = baseGuide();
    const noted = new Set([g.sources[0]!.url]);
    const r = verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g), evidenceUrls: noted });
    // s2 (authorizing) was fetched but has no notes: claims citing only s2 become uncertain
    const handleRefresh = r.guide.steps.find((s) => s.id === "handle-refresh")!;
    expect(handleRefresh.sourceIds).toEqual([]);
    expect(handleRefresh.evidence).toBe("uncertain");
    expect(r.notes.join()).toMatch(/no notes were taken/);
  });

  it("detaches blockers pointing at unknown steps", () => {
    const g = baseGuide();
    g.blockers[0]!.stepId = "nope";
    expect(verifyGuide(g, { mode: "agent", fetchedUrls: fetchedAll(g) }).guide.blockers[0]!.stepId).toBeUndefined();
  });
});
