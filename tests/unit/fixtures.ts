import github from "@/data/guides/github.json";
import type { Guide } from "@/lib/schema/guide.schema";

/**
 * A library guide used as the base for agent-mode tests.
 *
 * Agent mode never allows `tested` (only a human can mark that), and the live
 * GitHub guide now contains one hands-on claim. Strip it here so the fixture
 * describes what an agent would be allowed to produce.
 */
export const baseGuide = (): Guide => {
  const g = structuredClone(github) as Guide;
  const claims = [
    g.verdict,
    g.time.activeSetup,
    g.time.approvalWait,
    ...g.prerequisites,
    ...g.steps,
    ...g.scopes,
    ...g.nuances,
    ...g.blockers,
  ];
  for (const claim of claims) {
    if (claim.evidence === "tested") claim.evidence = "documented";
  }
  delete g.lastVerifiedAt;
  return g;
};
