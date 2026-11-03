import { UNTRUSTED_RULE } from "@/lib/security/promptBoundary";
import type { Note } from "@/lib/agent/state";
import type { ProbeObservation } from "@/lib/agent/probe";
import type { Source } from "@/lib/schema/guide.schema";

export const CHECKLIST = [
  "Does the provider support OAuth 2.0? PKCE? OAuth 1.0a? Or only API keys? Where are apps created?",
  "Exact steps to create the app; required fields (name, logo, privacy policy URL, redirect URIs)",
  "Scope tiers; which scopes trigger review or a security assessment",
  "Is review/approval needed? For what (public distribution, sensitive scopes, production)? Published timelines?",
  "Prerequisites: paid plan, verified domain, business verification, partner program",
  "Dev/sandbox vs production limits (test users, unpublished app limits, rate limits)",
  "Common rejection reasons (official guidance first, then community reports)",
];

export function researchSystemPrompt(appName: string, officialDomain: string | null): string {
  return [
    `You are researching how a developer registers an OAuth app with ${appName} and gets it approved, so an AI agent can act on a user's behalf.`,
    officialDomain ? `The provider's official domain appears to be ${officialDomain}.` : "The provider's official domain is not yet known.",
    "",
    "Answer as much of this checklist as you can:",
    ...CHECKLIST.map((c) => `- ${c}`),
    "",
    "Rules:",
    "- Prefer the provider's official developer docs and policy pages. Use community sources only for rejection reasons and gotchas.",
    "- After EVERY readPage, immediately call note once per useful finding (aim for 3–6 per page), passing the page's sourceId (e.g. s2). Anything you do not note is lost and cannot appear in the guide.",
    "- Cite everything. If you can't confirm something, say so in a note rather than guessing.",
    "- Do not estimate approval times without a source.",
    "- As soon as you know the URL where developers create/register the app (the developer console, e.g. a marketplace or 'developer apps' page), call flagConsoleUrl with it. It is observed later; never try to sign in.",
    "- You have a small budget (about 7 searches/page reads). Spend it on the official docs first. When a tool says the budget is exhausted, stop.",
    `- ${UNTRUSTED_RULE}`,
  ].join("\n");
}

export function researchUserPrompt(appName: string, hint: string | null): string {
  return [
    `Research OAuth app registration and approval for: ${appName}.`,
    hint ? `Starting points from an initial search:\n${hint}` : "",
    "Begin with the official docs for creating an app and for app review / verification.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const SYNTHESIS_SYSTEM = [
  "You turn research notes into a structured OAuth setup guide for developers.",
  "Use ONLY the notes, probe observations and sources provided. Do not add facts from memory.",
  "Evidence rules for every claim:",
  "- documented: supported by a note from an official_docs, policy or console source. Cite its id.",
  "- community: supported only by a community/other source. Cite its id.",
  "- probed: observed by the console probe (cite the console source id).",
  "- uncertain: anything not directly supported. Use an empty sourceIds list and add what is unknown to `unknowns`.",
  "- Never use 'tested'. Only a human can mark something tested.",
  "Time rules: activeSetup is hands-on minutes for a developer; if no source gives it, give a cautious range and mark it uncertain.",
  "approvalWait minDays/maxDays must be null unless a cited source states a timeline.",
  "verdict.oneLiner: one plain sentence under 160 characters that tells a developer what they are in for.",
  "scopes: only real scope identifiers stated in a source. If none are documented, return an empty list and say so in unknowns.",
  "Only cite a source id if a NOTE from that source supports the claim. A source listed without notes is not evidence.",
  "Difficulty: easy = keys in minutes, no review; moderate = review only for public distribution or some scopes; hard = mandatory verification or security assessment; gated = partner programme or approval that may be refused.",
  "If the provider does not support OAuth, set oauthSupport accordingly and explain the alternative (API keys etc.) in steps instead of inventing OAuth steps.",
  "Steps must be ordered, concrete and owned: agent (code/config an AI agent can write), human (console clicks, legal, payment), provider (waiting on their review).",
  "Use short kebab-case ids. Attach blockers to the affected step via stepId.",
  "Write plainly. No marketing language.",
].join("\n");

export function synthesisPrompt(input: {
  appName: string;
  officialDomain: string | null;
  sources: Source[];
  notes: Note[];
  probes: ProbeObservation[];
  today: string;
}): string {
  const idByUrl = new Map(input.sources.map((s) => [s.url, s.id]));
  const sourceLines = input.sources.map((s) => `${s.id} [${s.kind}] ${s.title} (${s.url})`);
  const noteLines = input.notes.map(
    (n, i) => `N${i + 1} (source ${idByUrl.get(n.sourceUrl) ?? "?"}): ${n.claim}${n.quote ? `\n   quote: "${n.quote}"` : ""}`,
  );
  const probeLines = input.probes.map((p) => {
    const id = idByUrl.get(p.url) ?? "?";
    if (!p.reachable) return `${p.url} (source ${id}): could not be reached`;
    return `${p.url} (source ${id}): ${p.requiresLogin ? `requires login${p.loginProvider ? ` (${p.loginProvider})` : ""}` : "reachable without login"}` +
      (p.visibleFields.length ? `; visible fields: ${p.visibleFields.join(", ")}` : "");
  });
  return [
    `App: ${input.appName}`,
    `Official domain: ${input.officialDomain ?? "unknown"}`,
    `Today: ${input.today}`,
    "",
    "SOURCES (cite by id):",
    sourceLines.length ? sourceLines.join("\n") : "(none)",
    "",
    "NOTES:",
    noteLines.length ? noteLines.join("\n") : "(no notes were recorded)",
    "",
    "CONSOLE PROBES (observed without signing in):",
    probeLines.length ? probeLines.join("\n") : "(no console was probed)",
  ].join("\n");
}
