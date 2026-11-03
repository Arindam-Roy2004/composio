// Fixed pipeline with one bounded agentic loop (Phase 2). Phases 0 and 6 live in the route.
import { generateText, isStepCount, Output, streamText, type LanguageModel, type StopCondition, type ToolSet } from "ai";
import { probeConsole } from "@/lib/agent/tools/probeConsole";
import { readPageTool } from "@/lib/agent/tools/readPage";
import { runSearch, webSearchTool } from "@/lib/agent/tools/webSearch";
import { flagConsoleTool, noteTool } from "@/lib/agent/tools/note";
import { researchSystemPrompt, researchUserPrompt, SYNTHESIS_SYSTEM, synthesisPrompt } from "@/lib/agent/prompts";
import { BUDGET, normUrl, RunState, type AgentDeps } from "@/lib/agent/state";
import { pickOfficialDomain, registrableDomain } from "@/lib/agent/sources";
import { verifyGuide } from "@/lib/agent/verify";
import { clampToGuide, GuideDraftSchema, type Guide, type GuideDraft, type Source } from "@/lib/schema/guide.schema";
import type { AgentEvent } from "@/lib/schema/events.schema";
import type { SanitizedQuery } from "@/lib/security/sanitize";
import { toSlug } from "@/lib/security/sanitize";
import { log } from "@/lib/log";

/** The LLM-facing half of the pipeline, injectable so the pipeline is testable without a model. */
export type Brain = {
  modelId: string;
  research(args: { system: string; prompt: string; tools: ToolSet; state: RunState; signal: AbortSignal }): Promise<void>;
  synthesise(args: { system: string; prompt: string; signal: AbortSignal }): Promise<GuideDraft>;
};

export function aiSdkBrain(model: LanguageModel, modelId: string): Brain {
  return {
    modelId,
    async research({ system, prompt, tools, state, signal }) {
      // Allow one more step after the budget runs out so the model can note what it just read.
      let exhaustedAt: number | null = null;
      const budgetDone: StopCondition<ToolSet> = ({ steps }) => {
        if (!state.researchExhausted) return false;
        exhaustedAt ??= steps.length;
        return steps.length > exhaustedAt;
      };
      const result = streamText({
        model,
        system,
        prompt,
        tools,
        stopWhen: [isStepCount(14), budgetDone],
        abortSignal: signal,
        maxRetries: 1,
        onError: ({ error }) => log.warn("research stream error", { error: error instanceof Error ? error.message : String(error) }),
        onStepFinish: (step) =>
          log.info("research step", { tools: step.toolCalls.map((c) => c.toolName), finishReason: step.finishReason }),
      });
      await result.consumeStream();
    },
    async synthesise({ system, prompt, signal }) {
      const t0 = Date.now();
      log.info("synthesis start", { model: modelId, promptChars: prompt.length });
      const { output, usage } = await generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema: GuideDraftSchema, name: "oauth_setup_guide" }),
        abortSignal: signal,
        maxRetries: 1,
      });
      log.info("synthesis done", { ms: Date.now() - t0, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens });
      return output;
    },
  };
}

export type RunResult = { guide: Guide; downgraded: number; notes: string[] };

type RunOpts = {
  query: SanitizedQuery;
  emit: (e: AgentEvent) => void;
  deps: AgentDeps;
  brain: Brain;
};

const isAbort = (err: unknown) => err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");

export async function runAgent({ query, emit, deps, brain }: RunOpts): Promise<RunResult> {
  const now = deps.now ?? Date.now;
  const startedAt = now();
  const deadline = AbortSignal.timeout(BUDGET.runDeadlineMs);
  const state = new RunState(query.slug, query.display, emit, startedAt);
  const stage = (s: Extract<AgentEvent, { type: "stage" }>["stage"], status: "start" | "done") => emit({ type: "stage", stage: s, status });

  // Phase 1: identify the official developer domain.
  stage("identify", "start");
  const first = await runSearch(state, deps, `${query.display} developer OAuth app create register`, deadline);
  const hits = ("results" in first ? first.results : undefined) ?? [];
  const officialDomain = pickOfficialDomain(hits, query.slug, query.domain);
  if (officialDomain) state.officialDomains.add(officialDomain);
  stage("identify", "done");

  if (!officialDomain) {
    return finish(state, honestUnknownGuide(query, "We could not find an official developer program for this app."), brain.modelId, now);
  }

  // Phase 2: agentic research, bounded by tool budget, step count and its own deadline.
  stage("research", "start");
  state.phase = "research";
  const tools = {
    webSearch: webSearchTool(state, deps),
    readPage: readPageTool(state, deps),
    note: noteTool(state),
    flagConsoleUrl: flagConsoleTool(state),
  };
  const hint = hits.slice(0, 5).map((h) => `- ${h.title}: ${h.url}`).join("\n");
  try {
    await brain.research({
      system: researchSystemPrompt(query.display, officialDomain),
      prompt: researchUserPrompt(query.display, hint || null),
      tools,
      state,
      signal: AbortSignal.any([deadline, AbortSignal.timeout(BUDGET.researchDeadlineMs)]),
    });
  } catch (err) {
    // Timeouts end research early; we synthesise with what we have and mark gaps uncertain.
    if (!isAbort(err)) log.warn("research failed", { error: err instanceof Error ? err.message : String(err) });
  }
  state.phase = "other";
  stage("research", "done");

  // Phase 3: probe the console page(s) the model flagged. Observation only.
  stage("probe", "start");
  state.phase = "probe";
  const candidates = state.consoleCandidates.filter((u) => {
    try {
      const reg = registrableDomain(new URL(u).hostname);
      // Consoles sometimes live on a sibling domain (docs on notion.com, console on notion.so).
      return state.officialDomains.has(reg) || reg.split(".")[0] === query.slug.split("-")[0];
    } catch {
      return false;
    }
  });
  for (const url of candidates.slice(0, BUDGET.maxConsoleProbes)) {
    if (deadline.aborted) break;
    await probeConsole(state, deps, url, deadline);
  }
  state.phase = "other";
  stage("probe", "done");

  // Phase 4: synthesise from notes + sources only.
  stage("synthesise", "start");
  const sources = state.uniqueSources();
  const remaining = Math.max(5_000, BUDGET.runDeadlineMs - (now() - startedAt) - 3_000);
  let draft: GuideDraft;
  try {
    draft = await brain.synthesise({
      system: SYNTHESIS_SYSTEM,
      prompt: synthesisPrompt({
        appName: query.display,
        officialDomain,
        sources,
        notes: state.notes,
        probes: state.probes,
        today: new Date(now()).toISOString().slice(0, 10),
      }),
      signal: AbortSignal.timeout(remaining),
    });
  } catch (err) {
    log.error("synthesis failed", { error: err instanceof Error ? err.message : String(err) });
    throw new SynthesisError();
  }
  stage("synthesise", "done");

  const guide = assemble(query, draft, sources, officialDomain);
  return finish(state, guide, brain.modelId, now);
}

export class SynthesisError extends Error {
  constructor() {
    super("The model could not produce a valid guide from the research.");
    this.name = "SynthesisError";
  }
}

/** Phase 5 (verify) plus run metadata. */
function finish(state: RunState, raw: unknown, modelId: string, now: () => number): RunResult {
  state.emit({ type: "stage", stage: "verify", status: "start" });
  const clamped = clampToGuide(raw);
  if (!clamped.success) {
    log.error("assembled guide invalid", { issues: clamped.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) });
    throw new SynthesisError();
  }
  const evidenceUrls = new Set([...state.notes.map((n) => normUrl(n.sourceUrl)), ...state.probedUrls]);
  const r = verifyGuide(clamped.data, { mode: "agent", fetchedUrls: state.fetchedUrlSet(), probedUrls: state.probedUrls, evidenceUrls });
  r.guide.agentRun = {
    toolCalls: state.toolCalls,
    pagesRead: state.pagesRead,
    durationMs: now() - state.startedAt,
    model: modelId.slice(0, 120),
    downgrades: r.downgraded,
  };
  state.emit({ type: "verification", downgraded: r.downgraded, notes: r.notes.slice(0, 50).map((n) => n.slice(0, 300)) });
  state.emit({ type: "stage", stage: "verify", status: "done" });
  return { guide: r.guide, downgraded: r.downgraded, notes: r.notes };
}

function uniqueIds<T extends { id: string }>(items: T[], fallback: (t: T, i: number) => string): Map<string, string> {
  const seen = new Set<string>();
  const remap = new Map<string, string>();
  items.forEach((item, i) => {
    let id = toSlug(item.id || fallback(item, i), 40) || `item-${i + 1}`;
    while (seen.has(id)) id = `${id.slice(0, 36)}-${i + 1}`;
    seen.add(id);
    remap.set(item.id, id);
    item.id = id;
  });
  return remap;
}

/** Joins the model's draft with code-owned fields. Sources come only from pages fetched this run. */
export function assemble(query: SanitizedQuery, draft: GuideDraft, sources: Source[], officialDomain: string): Record<string, unknown> {
  const d = structuredClone(draft);
  // Placeholder rows like "Unknown — not enumerated in sources" are not scopes.
  d.scopes = d.scopes.filter((sc) => !/\s/.test(sc.name.trim()) || !/unknown|not (listed|enumerated|found|documented)|n\/a/i.test(sc.name));
  const stepMap = uniqueIds(d.steps, (s) => s.title);
  uniqueIds(d.prerequisites, (p) => p.label);
  uniqueIds(d.nuances, (n) => n.title);
  uniqueIds(d.blockers, (b) => b.title);
  for (const b of d.blockers) if (b.stepId) b.stepId = stepMap.get(b.stepId) ?? toSlug(b.stepId, 40);
  d.steps.forEach((s, i) => (s.order = Number.isInteger(s.order) ? s.order : i + 1));

  let website = d.website;
  try {
    const u = new URL(website);
    if (u.protocol !== "https:" || registrableDomain(u.hostname) !== officialDomain) website = `https://${officialDomain}`;
  } catch {
    website = `https://${officialDomain}`;
  }

  const cited = new Set(
    [d.verdict, d.time.activeSetup, d.time.approvalWait, ...d.prerequisites, ...d.steps, ...d.scopes, ...d.nuances, ...d.blockers].flatMap(
      (c) => c.sourceIds,
    ),
  );
  // Keep cited sources first, then other fetched pages, within the schema's cap.
  const ordered = [...sources.filter((s) => cited.has(s.id)), ...sources.filter((s) => !cited.has(s.id))].slice(0, 20);

  return {
    schemaVersion: 1,
    slug: query.slug,
    ...d,
    appName: d.appName || query.display,
    website,
    generatedAt: new Date().toISOString(),
    generatedBy: "agent",
    sources: ordered,
  };
}

/** Deterministic guide for when no credible developer program is found. Everything is uncertain. */
export function honestUnknownGuide(query: SanitizedQuery, reason: string): Record<string, unknown> {
  const website = query.domain ? `https://${query.domain}` : `https://www.google.com/search?q=${encodeURIComponent(`${query.display} developer API`)}`;
  return {
    schemaVersion: 1,
    slug: query.slug,
    appName: query.display.slice(0, 80),
    website,
    category: "Unknown",
    oauthSupport: "unknown",
    generatedAt: new Date().toISOString(),
    generatedBy: "agent",
    verdict: { difficulty: "hard", oneLiner: `${reason} Treat this as unconfirmed.`.slice(0, 200), evidence: "uncertain", sourceIds: [] },
    time: {
      activeSetup: { minMinutes: 0, maxMinutes: 0, evidence: "uncertain", sourceIds: [] },
      approvalWait: { required: "unknown", minDays: null, maxDays: null, note: "No source found.", evidence: "uncertain", sourceIds: [] },
    },
    prerequisites: [],
    steps: [
      {
        id: "find-developer-program",
        order: 1,
        title: "Confirm whether a developer program exists",
        body: "Look for a 'Developers', 'API' or 'Integrations' link in the app's footer, or ask the vendor's support whether they offer OAuth for third-party apps.",
        owner: "human",
        phase: "prepare",
        estMinutes: null,
        evidence: "uncertain",
        sourceIds: [],
      },
    ],
    scopes: [],
    nuances: [],
    blockers: [],
    ownership: { agentCan: [], humanMust: ["Confirm with the vendor whether third-party OAuth apps are supported"] },
    unknowns: [reason, "Whether the app supports OAuth at all", "Where apps would be registered and whether review is required"],
    sources: [],
  };
}
