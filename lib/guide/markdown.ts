import { APPROVAL_LABEL, DIFFICULTY_META, EVIDENCE_META, formatApproval, formatMinutes, OWNER_META } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";

const ev = (c: { evidence: keyof typeof EVIDENCE_META; sourceIds: string[] }) =>
  `_${EVIDENCE_META[c.evidence].label}${c.sourceIds.length ? ` [${c.sourceIds.join(", ")}]` : ""}_`;

/** Plain-markdown export for "Copy as Markdown". */
export function guideToMarkdown(g: Guide, origin = ""): string {
  const lines: string[] = [];
  lines.push(`# ${g.appName}: OAuth app setup`, "");
  lines.push(`**${DIFFICULTY_META[g.verdict.difficulty].label}.** ${g.verdict.oneLiner} ${ev(g.verdict)}`, "");
  lines.push(`- Active work: ${formatMinutes(g.time.activeSetup.minMinutes, g.time.activeSetup.maxMinutes)} ${ev(g.time.activeSetup)}`);
  lines.push(`- Approval wait: ${formatApproval(g.time.approvalWait)} (${APPROVAL_LABEL[g.time.approvalWait.required]}) ${ev(g.time.approvalWait)}`);
  lines.push(`- ${g.generatedBy === "library" ? "Library guide" : "AI-generated"} · ${g.generatedAt.slice(0, 10)}${origin ? ` · ${origin}/guide/${g.slug}` : ""}`, "");
  if (g.prerequisites.length) {
    lines.push("## Before you start", "");
    for (const p of g.prerequisites) lines.push(`- [ ] **${p.label}**: ${p.detail} ${ev(p)}`);
    lines.push("");
  }
  lines.push("## Steps", "");
  for (const s of g.steps) {
    lines.push(`${s.order}. **${s.title}** (${OWNER_META[s.owner].short}${s.estMinutes ? `, ~${s.estMinutes} min` : ""}) ${ev(s)}`);
    lines.push(`   ${s.body}`);
    if (s.url) lines.push(`   ${s.url}`);
  }
  lines.push("");
  if (g.scopes.length) {
    lines.push("## Scopes", "", "| Scope | Tier | Review | Note |", "|---|---|---|---|");
    for (const s of g.scopes) lines.push(`| \`${s.name}\` | ${s.tier} | ${s.triggersReview === null ? "?" : s.triggersReview ? "yes" : "no"} | ${s.note} |`);
    lines.push("");
  }
  if (g.blockers.length) {
    lines.push("## Blockers", "");
    for (const b of g.blockers) lines.push(`- **${b.title}**: ${b.symptom} → ${b.fix} ${ev(b)}`);
    lines.push("");
  }
  if (g.nuances.length) {
    lines.push("## Nuances", "");
    for (const n of g.nuances) lines.push(`- **${n.title}**: ${n.body} ${ev(n)}`);
    lines.push("");
  }
  if (g.unknowns.length) {
    lines.push("## What we couldn't confirm", "");
    for (const u of g.unknowns) lines.push(`- ${u}`);
    lines.push("");
  }
  if (g.sources.length) {
    lines.push("## Sources", "");
    for (const s of g.sources) lines.push(`- [${s.id}] ${s.title} (${s.kind}): ${s.url}`);
  }
  return lines.join("\n");
}
