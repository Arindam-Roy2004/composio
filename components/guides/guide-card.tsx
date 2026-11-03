import { Clock, HourglassMedium, SealCheck, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { AppLogo } from "@/components/site/app-logo";
import { Item, ItemContent, ItemDescription, ItemFooter, ItemHeader, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMinutes } from "@/lib/format";
import type { GuideSummary } from "@/lib/schema/guide.schema";

function approvalShort(g: GuideSummary): string {
  if (g.approval === "no") return "No review";
  const { minDays, maxDays } = g.approvalDays;
  if (minDays === null && maxDays === null) return g.approval === "unknown" ? "Review unknown" : "Review needed";
  const hi = maxDays ?? minDays!;
  return hi >= 14 ? `Review ≤ ${Math.round(hi / 7)} wk` : `Review ≤ ${hi} days`;
}

/**
 * Directory card built on shadcn Item, so every card shares one type scale:
 * title 14/medium, body 14/muted, meta 12/muted.
 */
export function GuideCard({ g }: { g: GuideSummary }) {
  const library = g.generatedBy === "library";
  const time = g.activeSetup.maxMinutes > 0 ? formatMinutes(g.activeSetup.minMinutes, g.activeSetup.maxMinutes) : "Unknown";
  return (
    <Item asChild variant="outline" className="h-full flex-col flex-nowrap items-stretch gap-4 rounded-xl bg-card p-5 hover:border-border-strong">
      <Link href={`/guide/${g.slug}`}>
        <ItemHeader className="justify-start gap-3">
          <ItemMedia>
            <AppLogo name={g.appName} website={g.website} size={40} className="rounded-[10px]" />
          </ItemMedia>
          <ItemContent className="min-w-0 gap-0.5">
            <ItemTitle>{g.appName}</ItemTitle>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {library ? (
                <>
                  Library <SealCheck size={12} weight="fill" className="text-ev-tested" />
                </>
              ) : (
                <>
                  <Sparkle size={12} weight="duotone" /> AI-generated · {formatDate(g.generatedAt)}
                </>
              )}
            </span>
          </ItemContent>
        </ItemHeader>
        <ItemDescription className="shrink-0 grow">{g.oneLiner}</ItemDescription>
        <ItemFooter className="flex-col items-stretch gap-2.5 border-t pt-4">
          <DifficultyMeter difficulty={g.difficulty} compact />
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={12} /> {time}
            <span aria-hidden className="text-border-strong">
              ·
            </span>
            <HourglassMedium size={12} /> {approvalShort(g)}
          </span>
        </ItemFooter>
      </Link>
    </Item>
  );
}

export function GuideCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl p-5 ring-1 ring-border" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-[10px]" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <div className="mt-auto space-y-2.5 border-t pt-4">
        <Skeleton className="h-1 w-20" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}
