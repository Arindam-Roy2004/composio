import { Clock, HourglassMedium, SealCheck, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { AppLogo } from "@/components/site/app-logo";
import { formatDate, formatMinutes } from "@/lib/format";
import type { GuideSummary } from "@/lib/schema/guide.schema";

function approvalShort(g: GuideSummary): string {
  if (g.approval === "no") return "No review";
  const { minDays, maxDays } = g.approvalDays;
  if (minDays === null && maxDays === null) return g.approval === "unknown" ? "Review unknown" : "Review needed";
  const hi = maxDays ?? minDays!;
  return hi >= 14 ? `Review ≤ ${Math.round(hi / 7)} wk` : `Review ≤ ${hi} days`;
}

/** Directory card in the style of Linear/Composio: logo, name, provenance, two lines, one facts row. */
export function GuideCard({ g }: { g: GuideSummary }) {
  const library = g.generatedBy === "library";
  const time = g.activeSetup.maxMinutes > 0 ? formatMinutes(g.activeSetup.minMinutes, g.activeSetup.maxMinutes) : "Unknown";
  return (
    <Link
      href={`/guide/${g.slug}`}
      className="group flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-border transition-[background-color,box-shadow] duration-200 hover:bg-muted/40 hover:ring-border-strong focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="flex items-center gap-3">
        <AppLogo name={g.appName} website={g.website} size={40} className="rounded-[10px]" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium tracking-tight">{g.appName}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-subtle-foreground">
            {library ? (
              <>
                Library <SealCheck size={12} weight="fill" className="text-ev-tested" />
              </>
            ) : (
              <>
                AI-generated · {formatDate(g.generatedAt)} <Sparkle size={11} weight="duotone" />
              </>
            )}
          </p>
        </div>
      </div>

      <p className="mt-4 mb-5 line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">{g.oneLiner}</p>

      <div className="mt-auto space-y-2.5 border-t pt-4">
        <DifficultyMeter difficulty={g.difficulty} compact />
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Clock size={12} className="shrink-0" /> {time}
          <span className="text-border-strong">·</span>
          <HourglassMedium size={12} className="shrink-0" /> {approvalShort(g)}
        </p>
      </div>
    </Link>
  );
}
