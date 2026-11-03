"use client";

import { Clock, Gauge, HourglassMedium } from "@phosphor-icons/react";
import { CitationStack } from "@/components/agents/citations";
import { CountUp } from "@/components/guide/count-up";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { EvidenceBadge } from "@/components/guide/evidence-badge";
import { Inner, Tray } from "@/components/guide/sections";
import { APPROVAL_LABEL, DIFFICULTY_META, domainOf, formatApproval, formatDate, formatMinutes } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";

type Claim = { evidence: Guide["verdict"]["evidence"]; sourceIds: string[] };

function Stat({ icon, label, claim, value, sub }: { icon: React.ReactNode; label: string; claim: Claim; value: React.ReactNode; sub: string }) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] whitespace-nowrap text-muted-foreground">
          {icon}
          {label}
        </span>
        <EvidenceBadge evidence={claim.evidence} sourceIds={claim.sourceIds} />
      </div>
      <div className="mt-3 text-[26px] leading-none font-semibold tracking-[-0.03em]">{value}</div>
      <p className="mt-2 text-[13px] text-muted-foreground">{sub}</p>
    </div>
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
          {guide.generatedBy === "library" ? "Researched" : "Generated"} {formatDate(guide.generatedAt)}
          {guide.lastVerifiedAt && ` · last checked ${formatDate(guide.lastVerifiedAt)}`}
        </span>
      }
      meta={`${guide.sources.length} sources`}
    >
      <Inner>
        <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          <Stat
            icon={<Gauge size={15} weight="duotone" />}
            label="Difficulty"
            claim={guide.verdict}
            value={<DifficultyMeter difficulty={guide.verdict.difficulty} />}
            sub={DIFFICULTY_META[guide.verdict.difficulty].description}
          />
          <Stat icon={<Clock size={15} weight="duotone" />} label="Active work" claim={a} value={<CountUp text={formatMinutes(a.minMinutes, a.maxMinutes)} />} sub="Forms, config and code" />
          <Stat icon={<HourglassMedium size={15} weight="duotone" />} label="Approval wait" claim={w} value={<CountUp text={formatApproval(w)} />} sub={APPROVAL_LABEL[w.required]} />
        </div>
        {w.note && <p className="border-t px-4 py-3 text-[13px] leading-relaxed text-muted-foreground sm:px-5">{w.note}</p>}
      </Inner>
    </Tray>
  );
}
