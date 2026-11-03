"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GuideCard } from "@/components/guides/guide-card";
import { DIFFICULTY_META } from "@/lib/format";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

const SOURCES = { all: "All", library: "Library", agent: "AI-generated" } as const;
type SourceKey = keyof typeof SOURCES;
const LEVELS = ["easy", "moderate", "hard", "gated", "unknown"] as const;

function Segmented<T extends string>({ value, options, onChange, label, id }: { value: T; options: { key: T; label: string; count: number }[]; onChange: (v: T) => void; label: string; id: string }) {
  const reduce = useReducedMotion();
  return (
    <div role="tablist" aria-label={label} className="flex w-fit gap-0.5 overflow-x-auto rounded-xl bg-muted/60 p-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.key}
          role="tab"
          aria-selected={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors", value === o.key ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {value === o.key && <motion.span layoutId={id} className="absolute inset-0 rounded-lg bg-background shadow-card ring-1 ring-border" transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.15, duration: 0.35 }} />}
          <span className="relative">{o.label}</span>
          <span className="relative font-mono text-[10.5px] text-subtle-foreground tabular-nums">{o.count}</span>
        </button>
      ))}
    </div>
  );
}

/** Search and filter every guide: the fixed library and everything the agent has generated. */
export function GuidesBrowser({ guides }: { guides: GuideSummary[] }) {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<SourceKey>("all");
  const [level, setLevel] = useState<"any" | (typeof LEVELS)[number]>("any");
  const reduce = useReducedMotion();

  const bySource = (k: SourceKey) => guides.filter((g) => k === "all" || g.generatedBy === k);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bySource(source).filter(
      (g) => (level === "any" || g.difficulty === level) && (!needle || `${g.appName} ${g.category} ${g.slug}`.toLowerCase().includes(needle)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guides, q, source, level]);

  const levelOptions = [
    { key: "any" as const, label: "Any difficulty", count: bySource(source).length },
    ...LEVELS.filter((l) => bySource(source).some((g) => g.difficulty === l)).map((l) => ({ key: l, label: DIFFICULTY_META[l].label, count: bySource(source).filter((g) => g.difficulty === l).length })),
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative flex h-10 w-full items-center rounded-xl bg-background ring-1 ring-border focus-within:ring-brand/50 lg:max-w-xs">
          <MagnifyingGlass size={16} className="absolute left-3 text-subtle-foreground" />
          <span className="sr-only">Search guides</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by app or category" className="h-full w-full bg-transparent pr-9 pl-9 text-sm outline-none placeholder:text-subtle-foreground focus-visible:outline-none" />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 flex size-6 items-center justify-center rounded-md text-subtle-foreground hover:bg-muted hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          <Segmented id="src" label="Source" value={source} onChange={(v) => { setSource(v); setLevel("any"); }} options={(Object.keys(SOURCES) as SourceKey[]).map((k) => ({ key: k, label: SOURCES[k], count: bySource(k).length }))} />
          <Segmented id="lvl" label="Difficulty" value={level} onChange={setLevel} options={levelOptions} />
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl bg-muted/30 px-6 py-16 text-center ring-1 ring-border">
          <MagnifyingGlass size={28} weight="duotone" className="text-subtle-foreground" />
          <p className="mt-3 text-sm font-medium">No guide matches that</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Our agent can research it for you in about two minutes.</p>
          <Link href={q.trim().length >= 2 ? `/?q=${encodeURIComponent(q.trim())}#generate` : "/#generate"} className="mt-5 inline-flex h-9 items-center rounded-lg bg-foreground px-3.5 text-sm font-medium text-background hover:opacity-90">
            {q.trim().length >= 2 ? `Research “${q.trim()}”` : "Research an app"}
          </Link>
        </div>
      ) : (
        <motion.ul layout={!reduce} className="mt-8 grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {results.map((g) => (
              <motion.li key={g.slug} layout={!reduce} initial={reduce ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={reduce ? undefined : { opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="h-full">
                <GuideCard g={g} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
