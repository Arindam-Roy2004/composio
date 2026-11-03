"use client";

import { ArrowUpRight, Clock, HourglassMedium, MagnifyingGlass, SealCheck, Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { AppLogo } from "@/components/site/app-logo";
import { MagicCard } from "@/components/ui/magic-card";
import { formatMinutes, summaryApproval } from "@/lib/format";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

const FILTERS = {
  all: { label: "All", test: () => true },
  easy: { label: "Easy", test: (g: GuideSummary) => g.difficulty === "easy" },
  review: { label: "Needs review", test: (g: GuideSummary) => g.approval !== "no" && g.difficulty !== "gated" },
  gated: { label: "Gated", test: (g: GuideSummary) => g.difficulty === "gated" },
} as const;
type FilterKey = keyof typeof FILTERS;

const ease = [0.22, 1, 0.36, 1] as const;

export function LibraryGrid({ library, generated }: { library: GuideSummary[]; generated: GuideSummary[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const reduce = useReducedMotion();
  const all = [...library.map((g) => ({ g, lib: true })), ...generated.map((g) => ({ g, lib: false }))];
  const items = all.filter(({ g }) => FILTERS[filter].test(g));
  const count = (k: FilterKey) => all.filter(({ g }) => FILTERS[k].test(g)).length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filter guides" className="flex w-fit gap-0.5 overflow-x-auto rounded-xl bg-muted/60 p-1 [scrollbar-width:none]">
          {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={filter === k}
              onClick={() => setFilter(k)}
              className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors", filter === k ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {filter === k && (
                <motion.span layoutId="library-filter" className="absolute inset-0 rounded-lg bg-background shadow-card" transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.18, duration: 0.4 }} />
              )}
              <span className="relative">{FILTERS[k].label}</span>
              <span className="relative font-mono text-[10.5px] text-subtle-foreground tabular-nums">{count(k)}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-subtle-foreground">
          <SealCheck size={13} weight="duotone" className="mr-1 inline text-ev-tested" />
          Library guides are human-reviewed. <Sparkle size={13} weight="duotone" className="mr-1 ml-2 inline" />
          Others are AI-generated.
        </p>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {items.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex flex-col items-center rounded-2xl bg-muted/30 px-6 py-14 text-center"
          >
            <MagnifyingGlass size={28} weight="duotone" className="text-subtle-foreground" />
            <p className="mt-3 text-sm font-medium">Nothing here yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">No guide matches “{FILTERS[filter].label}”. Research an app above and it will appear here.</p>
          </motion.div>
        ) : (
          <motion.ul key="grid" layout={!reduce} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {items.map(({ g, lib }, i) => {
              const wide = filter === "all" && lib && (i === 0 || i === 1);
              return (
                <motion.li
                  key={g.slug}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, delay: reduce ? 0 : Math.min(i, 8) * 0.04, ease }}
                  className={cn("lg:col-span-2", wide && "lg:col-span-3")}
                >
                  <GuideCard g={g} lib={lib} wide={wide} />
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideCard({ g, lib, wide }: { g: GuideSummary; lib: boolean; wide: boolean }) {
  return (
    <Link href={`/guide/${g.slug}`} className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2">
      <MagicCard
        className="h-full rounded-2xl"
        gradientSize={260}
        gradientColor="color-mix(in oklch, var(--brand) 14%, transparent)"
        gradientOpacity={1}
        gradientFrom="var(--brand)"
        gradientTo="var(--ev-community)"
      >
        <div className={cn("flex h-full flex-col p-5", wide && "sm:p-6")}>
          <div className="flex items-start gap-3">
            <AppLogo name={g.appName} website={g.website} size={wide ? 44 : 38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className={cn("truncate font-semibold tracking-tight", wide ? "text-lg" : "text-base")}>{g.appName}</h3>
                {lib ? <SealCheck size={15} weight="fill" className="shrink-0 text-ev-tested" aria-label="Human-reviewed library guide" /> : <Sparkle size={14} weight="duotone" className="shrink-0 text-subtle-foreground" aria-label="AI-generated" />}
              </div>
              <p className="truncate text-xs text-subtle-foreground">{g.category}</p>
            </div>
            <span className="flex size-8 items-center justify-center rounded-lg text-subtle-foreground transition-all duration-300 group-hover:bg-muted group-hover:text-foreground">
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
          <p className={cn("mt-4 text-sm leading-relaxed text-muted-foreground", wide ? "line-clamp-3" : "line-clamp-2")}>{g.oneLiner}</p>
          <div className="mt-auto pt-5">
            <DifficultyMeter difficulty={g.difficulty} compact />
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-subtle-foreground">
              <span className="flex items-center gap-1">
                <Clock size={12} weight="duotone" /> ~{formatMinutes(g.activeSetup.minMinutes, g.activeSetup.maxMinutes)}
              </span>
              <span className="flex items-center gap-1">
                <HourglassMedium size={12} weight="duotone" /> {summaryApproval(g)}
              </span>
            </div>
          </div>
        </div>
      </MagicCard>
    </Link>
  );
}
