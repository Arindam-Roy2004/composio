import { ArrowUpRight, Clock, HourglassMedium } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { AppLogo } from "@/components/site/app-logo";
import { formatApprovalShort, formatMinutes } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

const DOT = { human: "bg-own-human", agent: "bg-own-agent", provider: "bg-own-provider" } as const;

/** A live, composed preview of one guide. Used in the landing strip and CTA (no screenshots). */
export function GuidePreviewCard({ guide, className, href = true }: { guide: Guide; className?: string; href?: boolean }) {
  const steps = [...guide.steps].sort((a, b) => a.order - b.order).slice(0, 3);
  const body = (
    <div className={cn("group flex h-full w-[340px] flex-col rounded-2xl bg-background p-5 text-left shadow-[0_20px_50px_-30px_oklch(0_0_0/55%)] ring-1 ring-border transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:ring-border-strong", className)}>
      <div className="flex items-center gap-3">
        <AppLogo name={guide.appName} website={guide.website} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight">{guide.appName}</p>
          <p className="truncate text-xs text-subtle-foreground">{guide.category}</p>
        </div>
        {href && <ArrowUpRight size={16} className="text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
      </div>
      <div className="mt-4">
        <DifficultyMeter difficulty={guide.verdict.difficulty} compact />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted/60 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock size={12} /> Active work</p>
          <p className="mt-1 text-[17px] font-semibold tracking-tight">{formatMinutes(guide.time.activeSetup.minMinutes, guide.time.activeSetup.maxMinutes)}</p>
        </div>
        <div className="rounded-xl bg-muted/60 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><HourglassMedium size={12} /> Approval wait</p>
          <p className="mt-1 truncate text-[17px] font-semibold tracking-tight">{formatApprovalShort(guide.time.approvalWait)}</p>
        </div>
      </div>
      <ol className="mt-4 space-y-2 border-t pt-4">
        {steps.map((s) => (
          <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-background", DOT[s.owner])}>{s.order}</span>
            <span className="truncate text-muted-foreground">{s.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
  return href ? (
    <Link href={`/guide/${guide.slug}`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2">
      {body}
    </Link>
  ) : (
    body
  );
}
