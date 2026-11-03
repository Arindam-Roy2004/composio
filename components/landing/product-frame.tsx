"use client";

import { ArrowRight, Clock, HourglassMedium, LockSimple } from "@phosphor-icons/react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { EvidencePill } from "@/components/guide/evidence-badge";
import { OwnerBadge } from "@/components/guide/owner-badge";
import { AppLogo } from "@/components/site/app-logo";
import { APPROVAL_LABEL, formatApproval, formatMinutes } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";

/** Framed, tilted preview of a real library guide that flattens as it scrolls into view. */
export function ProductFrame({ guide }: { guide: Guide }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.4, 1]);
  const steps = [...guide.steps].sort((a, b) => a.order - b.order).slice(0, 5);

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl [perspective:1600px]">
      <div className="absolute inset-x-12 -top-8 h-40 rounded-full bg-[radial-gradient(closest-side,var(--brand-glow),transparent)] blur-2xl" aria-hidden />
      <motion.div
        style={reduce ? undefined : { rotateX, scale, opacity, transformOrigin: "50% 0%" }}
        className="hairline-gradient inner-highlight relative overflow-hidden rounded-2xl shadow-[0_40px_120px_-40px_oklch(0_0_0/60%)]"
      >
        <div className="flex items-center gap-3 border-b px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-muted" />
            <span className="size-2.5 rounded-full bg-muted" />
            <span className="size-2.5 rounded-full bg-muted" />
          </div>
          <div className="mx-auto flex h-6 w-full max-w-xs items-center justify-center gap-1.5 rounded-md bg-muted/60 font-mono text-[11px] text-subtle-foreground">
            <LockSimple size={10} weight="bold" /> /guide/{guide.slug}
          </div>
          <span className="w-12" aria-hidden />
        </div>

        <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
          <div className="border-b p-5 sm:p-6 md:border-r md:border-b-0">
            <div className="flex items-center gap-3">
              <AppLogo name={guide.appName} website={guide.website} size={36} />
              <div>
                <p className="text-lg font-semibold tracking-tight">{guide.appName}</p>
                <p className="font-mono text-[11px] text-subtle-foreground">{guide.category}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <DifficultyMeter difficulty={guide.verdict.difficulty} compact />
              <EvidencePill evidence={guide.verdict.evidence} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-balance">{guide.verdict.oneLiner}</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <Stat icon={<Clock size={14} weight="duotone" />} label="Active work" value={formatMinutes(guide.time.activeSetup.minMinutes, guide.time.activeSetup.maxMinutes)} evidence={guide.time.activeSetup.evidence} />
              <Stat icon={<HourglassMedium size={14} weight="duotone" />} label="Approval wait" value={formatApproval(guide.time.approvalWait)} sub={APPROVAL_LABEL[guide.time.approvalWait.required]} evidence={guide.time.approvalWait.evidence} />
            </div>
          </div>
          <ol className="divide-y">
            {steps.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <span className="font-mono text-[11px] text-subtle-foreground">{String(s.order).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{s.title}</span>
                <OwnerBadge owner={s.owner} />
              </li>
            ))}
            <li className="px-5 py-3 sm:px-6">
              <Link href={`/guide/${guide.slug}`} className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                Open the full {guide.appName} guide <ArrowRight size={12} />
              </Link>
            </li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ icon, label, value, sub, evidence }: { icon: React.ReactNode; label: string; value: string; sub?: string; evidence: Guide["verdict"]["evidence"] }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums">{value}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <EvidencePill evidence={evidence} />
        {sub && <span className="truncate text-[10.5px] text-subtle-foreground">{sub}</span>}
      </div>
    </div>
  );
}
