"use client";

import { Binoculars, BookOpenText, SealCheck, SealQuestion, UsersThree } from "@phosphor-icons/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useSources } from "@/components/guide/sources-context";
import { domainOf, EVIDENCE_META } from "@/lib/format";
import type { EvidenceLevel } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

const ICON = { tested: SealCheck, probed: Binoculars, documented: BookOpenText, community: UsersThree, uncertain: SealQuestion } as const;

const TONE: Record<EvidenceLevel, string> = {
  tested: "text-ev-tested border-ev-tested/35 bg-ev-tested/10",
  probed: "text-ev-probed border-ev-probed/35 bg-ev-probed/10",
  documented: "text-ev-documented border-ev-documented/35 bg-ev-documented/10",
  community: "text-ev-community border-ev-community/35 bg-ev-community/10",
  uncertain: "text-ev-uncertain border-ev-uncertain/50 border-dashed bg-transparent",
};

export function EvidencePill({ evidence, className, children }: { evidence: EvidenceLevel; className?: string; children?: React.ReactNode }) {
  const Icon = ICON[evidence];
  return (
    <span className={cn("inline-flex h-[22px] shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium", TONE[evidence], className)}>
      <Icon size={12} weight="duotone" aria-hidden />
      {EVIDENCE_META[evidence].label}
      {children}
    </span>
  );
}

/** Evidence label for one claim. Hover (or focus) shows exactly which sources back it. */
export function EvidenceBadge({ evidence, sourceIds, className }: { evidence: EvidenceLevel; sourceIds: string[]; className?: string }) {
  const sources = useSources();
  const cited = sourceIds.map((id) => sources.get(id)).filter((s) => s !== undefined);
  const firstId = cited[0]?.id;
  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>
        <a
          href={firstId ? `#source-${firstId}` : "#unknowns"}
          className={cn("rounded-md transition-opacity hover:opacity-80", className)}
          aria-label={`${EVIDENCE_META[evidence].label}${cited.length ? `, ${cited.length} source${cited.length > 1 ? "s" : ""}` : ""}`}
        >
          <EvidencePill evidence={evidence}>
            {cited.length > 0 && <span className="font-mono opacity-70">{cited.map((s) => s.id.slice(1)).join(",")}</span>}
          </EvidencePill>
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 text-sm" align="start">
        <p className="font-medium">{EVIDENCE_META[evidence].label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{EVIDENCE_META[evidence].description}</p>
        {cited.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {cited.map((s) => (
              <li key={s.id} className="text-xs">
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="line-clamp-2 font-medium underline-offset-2 hover:underline">
                  [{s.id.slice(1)}] {s.title}
                </a>
                <span className="font-mono text-subtle-foreground">
                  {domainOf(s.url)} · {s.kind.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">No source backs this claim. See “What we couldn’t confirm”.</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
