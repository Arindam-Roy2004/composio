"use client";

import { ArrowUpRight, BookCheck, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { DifficultyPill } from "@/components/guide/difficulty-meter";
import { AppLogo } from "@/components/site/app-logo";
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

export function LibraryGrid({ library, generated }: { library: GuideSummary[]; generated: GuideSummary[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const reduce = useReducedMotion();
  const items = [...library.map((g) => ({ g, lib: true })), ...generated.map((g) => ({ g, lib: false }))].filter(({ g }) => FILTERS[filter].test(g));

  return (
    <section id="library" aria-labelledby="library-title" className="scroll-mt-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="library-title" className="text-lg font-semibold tracking-tight">Library</h2>
          <p className="text-sm text-muted-foreground">Five apps picked to show very different setup challenges, plus guides others have generated.</p>
        </div>
        <div role="tablist" aria-label="Filter guides" className="flex gap-1 overflow-x-auto rounded-full border bg-card p-1">
          {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={filter === k}
              onClick={() => setFilter(k)}
              className={cn(
                "relative shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === k ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter === k && (
                <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-muted" transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.35 }} />
              )}
              <span className="relative">{FILTERS[k].label}</span>
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed p-6 text-center text-sm text-subtle-foreground">No guides match this filter yet.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ g, lib }, i) => (
            <motion.li
              key={g.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(i, 10) * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className={cn(lib && i === 0 && filter === "all" && "lg:col-span-2")}
            >
              <Link
                href={`/guide/${g.slug}`}
                className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-glow motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start gap-3">
                  <AppLogo name={g.appName} website={g.website} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{g.appName}</h3>
                      {lib ? (
                        <BookCheck className="size-3.5 shrink-0 text-ev-tested" strokeWidth={1.5} aria-label="Library guide" />
                      ) : (
                        <Sparkles className="size-3.5 shrink-0 text-subtle-foreground" strokeWidth={1.5} aria-label="AI-generated" />
                      )}
                    </div>
                    <p className="truncate text-xs text-subtle-foreground">{g.category}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{g.oneLiner}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <DifficultyPill difficulty={g.difficulty} />
                  <span className="font-mono text-[11px] text-subtle-foreground">
                    setup ~{formatMinutes(g.activeSetup.minMinutes, g.activeSetup.maxMinutes)} · {summaryApproval(g)}
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
