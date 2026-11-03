import { z } from "zod";

export const EVIDENCE = ["tested", "probed", "documented", "community", "uncertain"] as const;
export const Evidence = z.enum(EVIDENCE);
// tested     = a human actually did it; date recorded in VERIFICATION.md / lastVerifiedAt
// probed     = the agent reached the page/console and observed it
// documented = stated in the provider's official docs (must cite an official source)
// community  = forum / blog / StackOverflow (must cite a source)
// uncertain  = not confirmed; say what is unknown and how to find out

export const DIFFICULTY = ["easy", "moderate", "hard", "gated", "unknown"] as const;
export const OWNER = ["agent", "human", "provider"] as const;
export const PHASE = ["prepare", "create", "configure", "review", "launch"] as const;
export const OAUTH_SUPPORT = ["oauth2", "oauth2_pkce", "oauth1", "api_key_only", "none", "unknown"] as const;
export const APPROVAL_REQUIRED = ["no", "for_some_scopes", "for_public_use", "always", "unknown"] as const;
export const SOURCE_KIND = ["official_docs", "console", "policy", "community", "other"] as const;

/**
 * One definition, two strictness modes:
 *  - strict: length/count caps and URL checks. Used for storage, the library and rendering.
 *  - lenient: same shape, caps only described. Handed to the LLM so a long string doesn't fail a
 *    whole run; clampToGuide() then trims to the strict caps before the strict parse.
 */
function build(lenient: boolean) {
  const text = (max: number) => (lenient ? z.string().describe(`At most ${max} characters`) : z.string().max(max));
  const list = <T extends z.ZodType>(item: T, max: number, min = 0) => {
    const a = z.array(item);
    return lenient ? a.describe(`${min ? `${min} to ` : "At most "}${max} items`) : a.min(min).max(max);
  };
  const url = () => (lenient ? z.string() : z.url({ protocol: /^https$/, error: "Must be an https URL" }));
  const id = () => (lenient ? z.string() : z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/, "Invalid id"));
  const sourceIds = () =>
    list(z.string(), 5).describe("ids from the provided source list that support this claim");
  const claim = { evidence: Evidence, sourceIds: sourceIds() };
  const nonNeg = () => (lenient ? z.number() : z.number().min(0));

  const verdict = z.object({
    difficulty: z.enum(DIFFICULTY).describe("gated = partner program / approval that may be refused; unknown = not enough evidence to rate"),
    oneLiner: text(200),
    ...claim,
  });

  const time = z.object({
    activeSetup: z.object({ minMinutes: nonNeg(), maxMinutes: nonNeg(), ...claim }),
    approvalWait: z.object({
      required: z.enum(APPROVAL_REQUIRED),
      minDays: nonNeg().nullable(),
      maxDays: nonNeg().nullable(),
      note: text(300),
      ...claim,
    }),
  });

  const prerequisite = z.object({
    id: id(),
    label: text(120),
    detail: text(400),
    kind: z.enum(["account", "domain", "legal", "business", "payment", "technical", "other"]),
    ...claim,
  });

  const step = z.object({
    id: id(),
    order: z.number().int(),
    title: text(120),
    body: text(800),
    owner: z.enum(OWNER).describe("provider = waiting on the provider's review"),
    phase: z.enum(PHASE),
    estMinutes: nonNeg().nullable(),
    url: url().optional().describe("deep link to the console page, if known from a source"),
    agentCanHelp: text(300).optional(),
    ...claim,
  });

  const scope = z.object({
    name: text(120),
    tier: z.enum(["basic", "sensitive", "restricted", "unknown"]),
    triggersReview: z.boolean().nullable(),
    note: text(300),
    ...claim,
  });

  const nuance = z.object({ id: id(), title: text(120), body: text(600), ...claim });

  const blocker = z.object({
    id: id(),
    title: text(120),
    symptom: text(300),
    fix: text(500),
    severity: z.enum(["low", "medium", "high"]),
    stepId: id().optional().describe("id of the step this blocker affects"),
    ...claim,
  });

  const ownership = z.object({ agentCan: list(text(160), 8), humanMust: list(text(160), 8) });

  const body = {
    appName: text(80),
    website: url().optional(),
    category: text(40),
    oauthSupport: z.enum(OAUTH_SUPPORT),
    verdict,
    time,
    prerequisites: list(prerequisite, 12),
    steps: list(step, 15, 1),
    scopes: list(scope, 15),
    nuances: list(nuance, 10),
    blockers: list(blocker, 10),
    ownership,
    unknowns: list(text(300), 8),
  };

  return { body };
}

const strict = build(false);
const lenient = build(true);

export const SourceSchema = z.object({
  id: z.string().regex(/^s\d{1,2}$/),
  url: z.url({ protocol: /^https$/, error: "Must be an https URL" }),
  title: z.string().max(200),
  kind: z.enum(SOURCE_KIND),
  fetchedAt: z.iso.datetime().optional(),
});

export const AgentRunSchema = z.object({
  toolCalls: z.number().int().min(0),
  pagesRead: z.number().int().min(0),
  durationMs: z.number().min(0),
  model: z.string().max(120),
  downgrades: z.number().int().min(0).optional(),
});

export const GuideSchema = z
  .object({
    schemaVersion: z.literal(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64),
    ...strict.body,
    logoUrl: z.url({ protocol: /^https$/ }).optional(),
    generatedAt: z.iso.datetime(),
    generatedBy: z.enum(["library", "agent"]),
    lastVerifiedAt: z.iso.datetime().optional(),
    sources: z.array(SourceSchema).max(20),
    agentRun: AgentRunSchema.optional(),
  })
  .strict();

/** What the LLM is asked to produce. Identity, sources and run metadata are filled in by code. */
export const GuideDraftSchema = z.object(lenient.body);

export type Guide = z.infer<typeof GuideSchema>;
export type GuideDraft = z.infer<typeof GuideDraftSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type EvidenceLevel = z.infer<typeof Evidence>;
export type Step = Guide["steps"][number];

export type GuideSummary = Pick<
  Guide,
  "slug" | "appName" | "website" | "category" | "logoUrl" | "generatedBy" | "generatedAt" | "lastVerifiedAt" | "oauthSupport"
> & {
  difficulty: Guide["verdict"]["difficulty"];
  oneLiner: string;
  activeSetup: { minMinutes: number; maxMinutes: number };
  approval: Guide["time"]["approvalWait"]["required"];
  approvalDays: { minDays: number | null; maxDays: number | null };
};

export function toSummary(g: Guide): GuideSummary {
  return {
    slug: g.slug,
    appName: g.appName,
    website: g.website,
    category: g.category,
    logoUrl: g.logoUrl,
    generatedBy: g.generatedBy,
    generatedAt: g.generatedAt,
    lastVerifiedAt: g.lastVerifiedAt,
    oauthSupport: g.oauthSupport,
    difficulty: g.verdict.difficulty,
    oneLiner: g.verdict.oneLiner,
    activeSetup: { minMinutes: g.time.activeSetup.minMinutes, maxMinutes: g.time.activeSetup.maxMinutes },
    approval: g.time.approvalWait.required,
    approvalDays: { minDays: g.time.approvalWait.minDays, maxDays: g.time.approvalWait.maxDays },
  };
}

type Obj = Record<PropertyKey, unknown>;

function parentOf(root: unknown, path: PropertyKey[]): [Obj | unknown[] | null, PropertyKey] {
  let cur: unknown = root;
  for (let i = 0; i < path.length - 1; i++) {
    if (cur === null || typeof cur !== "object") return [null, ""];
    cur = (cur as Obj)[path[i]!];
  }
  return [cur !== null && typeof cur === "object" ? (cur as Obj) : null, path[path.length - 1]!];
}

/**
 * Trims over-long strings/arrays and drops invalid optional URLs so a near-valid generation passes
 * the strict schema. Anything still invalid afterwards is a real failure.
 */
export function clampToGuide(input: unknown) {
  const value = structuredClone(input);
  let r = GuideSchema.safeParse(value);
  for (let pass = 0; pass < 4 && !r.success; pass++) {
    let changed = false;
    for (const issue of r.error.issues) {
      const [parent, key] = parentOf(value, issue.path);
      if (!parent) continue;
      const cur = (parent as Obj)[key];
      if (issue.code === "too_big" && typeof cur === "string") {
        (parent as Obj)[key] = `${cur.slice(0, Math.max(0, Number(issue.maximum) - 1)).trimEnd()}…`;
        changed = true;
      } else if (issue.code === "too_big" && Array.isArray(cur)) {
        cur.length = Number(issue.maximum);
        changed = true;
      } else if (
        (issue.code === "invalid_format" || issue.code === "invalid_type") &&
        (key === "url" || key === "logoUrl" || key === "stepId" || key === "agentCanHelp") &&
        !Array.isArray(parent)
      ) {
        delete (parent as Obj)[key];
        changed = true;
      }
    }
    if (!changed) break;
    r = GuideSchema.safeParse(value);
  }
  return r;
}
