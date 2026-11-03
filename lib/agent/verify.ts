// Deterministic evidence checks. No LLM. Runs on every agent guide (Phase 5) and on library JSON.
import type { EvidenceLevel, Guide, Source } from "@/lib/schema/guide.schema";

type Claim = { evidence: EvidenceLevel; sourceIds: string[] };

export type VerifyContext = {
  /** "agent": sources must have been fetched this run and `tested` is never allowed. */
  mode: "agent" | "library";
  fetchedUrls?: Set<string>;
  probedUrls?: Set<string>;
  /** Agent mode: pages the agent recorded notes from (or probed). Only these may be cited. */
  evidenceUrls?: Set<string>;
};

export type VerifyResult = { guide: Guide; notes: string[]; downgraded: number };

const OFFICIAL_KINDS = new Set<Source["kind"]>(["official_docs", "policy", "console"]);
const MAX_UNKNOWNS = 8;
const MAX_APPROVAL_DAYS = 365;

function claimsOf(g: Guide): { label: string; claim: Claim }[] {
  return [
    { label: "verdict", claim: g.verdict },
    { label: "active setup time", claim: g.time.activeSetup },
    { label: "approval wait", claim: g.time.approvalWait },
    ...g.prerequisites.map((p) => ({ label: `prerequisite "${p.label}"`, claim: p })),
    ...g.steps.map((s) => ({ label: `step "${s.title}"`, claim: s })),
    ...g.scopes.map((s) => ({ label: `scope "${s.name}"`, claim: s })),
    ...g.nuances.map((n) => ({ label: `nuance "${n.title}"`, claim: n })),
    ...g.blockers.map((b) => ({ label: `blocker "${b.title}"`, claim: b })),
  ];
}

// Same page regardless of fragment, query string or trailing slash.
const normUrl = (u: string) => u.replace(/[?#].*$/, "").replace(/\/$/, "");

export function verifyGuide(input: Guide, ctx: VerifyContext): VerifyResult {
  const g: Guide = structuredClone(input);
  const notes: string[] = [];
  let downgraded = 0;
  const unknowns = new Set(g.unknowns);

  // 1. Sources: in agent mode, every source must have been fetched during this run.
  if (ctx.mode === "agent") {
    const fetched = new Set([...(ctx.fetchedUrls ?? [])].map(normUrl));
    const kept = g.sources.filter((s) => fetched.has(normUrl(s.url)));
    for (const s of g.sources) if (!kept.includes(s)) notes.push(`Removed source ${s.id} (${s.url}): not fetched this run`);
    g.sources = kept;
  }
  const byId = new Map(g.sources.map((s) => [s.id, s]));

  const downgrade = (label: string, claim: Claim, to: EvidenceLevel, why: string) => {
    if (claim.evidence === to) return;
    notes.push(`${label}: ${claim.evidence} → ${to} (${why})`);
    claim.evidence = to;
    downgraded++;
    if (to === "uncertain") unknowns.add(`Could not confirm ${label}: ${why}.`);
  };

  for (const { label, claim } of claimsOf(g)) {
    // 2. Every sourceId must exist.
    const missing = claim.sourceIds.filter((id) => !byId.has(id));
    if (missing.length) {
      claim.sourceIds = claim.sourceIds.filter((id) => byId.has(id));
      notes.push(`${label}: dropped unknown source ids ${missing.join(", ")}`);
    }
    // 3. In agent mode a claim may only cite pages the agent actually took notes from (or probed).
    //    A page known only by its title is not evidence.
    if (ctx.evidenceUrls) {
      const unread = claim.sourceIds.filter((id) => !ctx.evidenceUrls!.has(normUrl(byId.get(id)!.url)));
      if (unread.length) {
        claim.sourceIds = claim.sourceIds.filter((id) => !unread.includes(id));
        notes.push(`${label}: dropped ${unread.join(", ")} (no notes were taken from that page)`);
      }
    }
    const cited = claim.sourceIds.map((id) => byId.get(id)!);

    switch (claim.evidence) {
      case "tested":
        if (ctx.mode === "agent") downgrade(label, claim, cited.length ? "documented" : "uncertain", "only a human can mark a claim tested");
        else if (!g.lastVerifiedAt) downgrade(label, claim, "uncertain", "tested claims need lastVerifiedAt");
        break;
      case "documented":
        if (!cited.length) downgrade(label, claim, "uncertain", "no source cited");
        else if (!cited.some((s) => OFFICIAL_KINDS.has(s.kind))) downgrade(label, claim, "community", "documented requires an official source");
        break;
      case "community":
        if (!cited.length) downgrade(label, claim, "uncertain", "no source cited");
        break;
      case "probed": {
        const consoles = cited.filter((s) => s.kind === "console");
        const probedOk =
          ctx.mode === "agent"
            ? consoles.some((s) => ctx.probedUrls?.has(normUrl(s.url)))
            : consoles.length > 0;
        if (!probedOk) downgrade(label, claim, cited.length ? "documented" : "uncertain", "probed requires a console page probed this run");
        // A "documented" fallback still needs an official source.
        if ((claim.evidence as EvidenceLevel) === "documented" && !cited.some((s) => OFFICIAL_KINDS.has(s.kind)))
          downgrade(label, claim, "community", "documented requires an official source");
        break;
      }
      case "uncertain":
        break;
    }
  }

  // 3. Time sanity.
  const a = g.time.activeSetup;
  if (a.minMinutes > a.maxMinutes) {
    [a.minMinutes, a.maxMinutes] = [a.maxMinutes, a.minMinutes];
    notes.push("Active setup range was inverted; swapped min and max");
  }
  const w = g.time.approvalWait;
  if (w.minDays !== null && w.maxDays !== null && w.minDays > w.maxDays) {
    [w.minDays, w.maxDays] = [w.maxDays, w.minDays];
    notes.push("Approval range was inverted; swapped min and max");
  }
  if ((w.minDays ?? 0) > MAX_APPROVAL_DAYS || (w.maxDays ?? 0) > MAX_APPROVAL_DAYS) {
    w.minDays = null;
    w.maxDays = null;
    downgrade("approval wait", w, "uncertain", `approval days above ${MAX_APPROVAL_DAYS} are not credible`);
  }
  if (w.required !== "no" && (w.minDays !== null || w.maxDays !== null) && !w.sourceIds.length) {
    w.minDays = null;
    w.maxDays = null;
    notes.push("Removed approval timeline: no source supports it");
    downgrade("approval wait", w, "uncertain", "approval timeline has no source");
  }

  // 4. Difficulty must be consistent with the approval requirement.
  if (g.verdict.difficulty === "easy" && (w.required === "always" || w.required === "for_public_use")) {
    g.verdict.difficulty = "moderate";
    notes.push(`Difficulty easy → moderate: approval is required ${w.required.replaceAll("_", " ")}`);
    downgraded++;
  }

  // 5. Structural tidy-up.
  const stepIds = new Set(g.steps.map((s) => s.id));
  for (const b of g.blockers) {
    if (b.stepId && !stepIds.has(b.stepId)) {
      notes.push(`Blocker "${b.title}" pointed at unknown step ${b.stepId}; detached`);
      delete b.stepId;
    }
  }
  g.steps.sort((x, y) => x.order - y.order).forEach((s, i) => (s.order = i + 1));
  g.unknowns = [...unknowns].slice(0, MAX_UNKNOWNS).map((u) => (u.length > 300 ? `${u.slice(0, 299)}…` : u));

  return { guide: g, notes, downgraded };
}

/** For library JSON: a library guide must already pass verification with zero changes. */
export function checkGuideConsistency(g: Guide): string[] {
  return verifyGuide(g, { mode: "library" }).notes;
}
