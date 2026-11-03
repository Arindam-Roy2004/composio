import { ArrowUpRight, Clock, HourglassMedium, SealCheck, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { AppLogo } from "@/components/site/app-logo";
import { formatDate, formatMinutes } from "@/lib/format";
import type { GuideSummary } from "@/lib/schema/guide.schema";

function approvalShort(g: GuideSummary): string {
  if (g.approval === "no") return "None";
  const { minDays, maxDays } = g.approvalDays;
  if (minDays === null && maxDays === null) return g.approval === "unknown" ? "Unknown" : "Unpublished";
  const hi = maxDays ?? minDays!;
  return hi >= 14 ? `Up to ${Math.round(hi / 7)} wk` : `Up to ${hi} days`;
}

/** One guide in the All guides grid. Fixed structure so every card lines up. */
export function GuideCard({ g }: { g: GuideSummary }) {
  const library = g.generatedBy === "library";
  return (
    <Link
      href={`/guide/${g.slug}`}
      className="group flex h-full flex-col rounded-2xl bg-background p-5 ring-1 ring-border transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_oklch(0_0_0/55%)] hover:ring-border-strong focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="flex items-start gap-3">
        <AppLogo name={g.appName} website={g.website} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight">{g.appName}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-subtle-foreground">
            {library ? (
              <>
                <SealCheck size={12} weight="fill" className="text-ev-tested" /> Library
              </>
            ) : (
              <>
                <Sparkle size={12} weight="duotone" /> AI-generated {formatDate(g.generatedAt)}
              </>
            )}
          </p>
        </div>
        <ArrowUpRight size={16} className="mt-1 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      <p className="mt-4 line-clamp-2 min-h-[2.75rem] text-[13px] leading-relaxed text-muted-foreground">{g.oneLiner}</p>

      <div className="mt-auto pt-4">
        <DifficultyMeter difficulty={g.difficulty} compact />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/60 px-3 py-2">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock size={12} /> Active work
            </p>
            <p className="mt-0.5 text-sm font-semibold tracking-tight">{g.activeSetup.maxMinutes > 0 ? formatMinutes(g.activeSetup.minMinutes, g.activeSetup.maxMinutes) : "Unknown"}</p>
          </div>
          <div className="rounded-xl bg-muted/60 px-3 py-2">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <HourglassMedium size={12} /> Approval
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold tracking-tight">{approvalShort(g)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
