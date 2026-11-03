"use client";

import { Clock, Gauge, HourglassMedium } from "@phosphor-icons/react";
import { CitationStack } from "@/components/agents/citations";
import { CountUp } from "@/components/guide/count-up";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { EvidenceBadge } from "@/components/guide/evidence-badge";
import { Inner, Tray } from "@/components/guide/sections";
import { APPROVAL_LABEL, DIFFICULTY_META, domainOf, formatApproval, formatDate, formatMinutes } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";

function Cell({ icon, label, children, claim }: { icon: React.ReactNode; label: string; children: React.ReactNode; claim: { evidence: Guide["verdict"]["evidence"]; sourceIds: string[] } }) {
  return (
    <Inner className="flex flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] whitespace-nowrap text-muted-foreground">
          {icon}
          {label}
        </span>
        <EvidenceBadge evidence={claim.evidence} sourceIds={claim.sourceIds} />
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </Inner>
  );
}

export function AtAGlance({ guide }: { guide: Guide }) {
  const { activeSetup: a, approvalWait: w } = guide.time;
  return (
    <Tray
      label={
        <span className="flex items-center gap-2">
          {guide.sources.length > 0 && (
            <CitationStack limit={4} citations={guide.sources.map((s) => ({ id: s.id, title: s.title, domain: domainOf(s.url), url: s.url }))} />
          )}
          <span>
            {guide.generatedBy === "library" ? "Researched from official docs" : "AI-generated"} · {formatDate(guide.generatedAt)}
            {guide.lastVerifiedAt ? ` · verified ${formatDate(guide.lastVerifiedAt)}` : " · not yet hands-on verified"}
          </span>
        </span>
      }
      meta={`${guide.sources.length} sources`}
    >
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3">
        <Cell icon={<Gauge size={15} weight="duotone" />} label="Difficulty" claim={guide.verdict}>
          <DifficultyMeter difficulty={guide.verdict.difficulty} />
          <p className="mt-2.5 text-[13px] text-muted-foreground">{DIFFICULTY_META[guide.verdict.difficulty].description}</p>
        </Cell>
        <Cell icon={<Clock size={15} weight="duotone" />} label="Active work" claim={a}>
          <p className="text-[28px] leading-none font-semibold tracking-[-0.03em]">
            <CountUp text={formatMinutes(a.minMinutes, a.maxMinutes)} />
          </p>
          <p className="mt-2.5 text-[13px] text-muted-foreground">Hands-on time for forms, config and code.</p>
        </Cell>
        <Cell icon={<HourglassMedium size={15} weight="duotone" />} label="Approval wait" claim={w}>
          <p className="text-[28px] leading-none font-semibold tracking-[-0.03em]">
            <CountUp text={formatApproval(w)} />
          </p>
          <p className="mt-2.5 text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground">{APPROVAL_LABEL[w.required]}.</span> {w.note}
          </p>
        </Cell>
      </div>
    </Tray>
  );
}
