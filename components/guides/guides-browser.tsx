"use client";

import { MagnifyingGlass, SealCheck, Sparkle, SquaresFour, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuideCard } from "@/components/guides/guide-card";
import { DIFFICULTY_META } from "@/lib/format";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

type SourceKey = "all" | "library" | "agent";
const LEVELS = ["easy", "moderate", "hard", "gated", "unknown"] as const;
type Level = "any" | (typeof LEVELS)[number];
type Sort = "easiest" | "hardest" | "newest" | "az";

const DOT: Record<(typeof LEVELS)[number], string> = {
  easy: "bg-diff-easy",
  moderate: "bg-diff-moderate",
  hard: "bg-diff-hard",
  gated: "bg-diff-gated",
  unknown: "bg-muted-foreground",
};
const RANK = { easy: 1, moderate: 2, hard: 3, gated: 4, unknown: 5 } as const;

const SORTS: Record<Sort, { label: string; fn: (a: GuideSummary, b: GuideSummary) => number }> = {
  easiest: { label: "Easiest first", fn: (a, b) => RANK[a.difficulty] - RANK[b.difficulty] || a.appName.localeCompare(b.appName) },
  hardest: { label: "Hardest first", fn: (a, b) => (RANK[b.difficulty] % 5) - (RANK[a.difficulty] % 5) || a.appName.localeCompare(b.appName) },
  newest: { label: "Newest first", fn: (a, b) => b.generatedAt.localeCompare(a.generatedAt) },
  az: { label: "A to Z", fn: (a, b) => a.appName.localeCompare(b.appName) },
};

function RailItem({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 w-auto shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] transition-colors lg:w-full",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <span className="flex w-4 shrink-0 justify-center">{icon}</span>
      <span className="whitespace-nowrap lg:flex-1 lg:truncate">{label}</span>
      <span className="font-mono text-[11px] text-subtle-foreground tabular-nums">{count}</span>
    </button>
  );
}

function Grid({ items }: { items: GuideSummary[] }) {
  const reduce = useReducedMotion();
  return (
    <motion.ul layout={!reduce} className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((g) => (
          <motion.li
            key={g.slug}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <GuideCard g={g} />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

/** Directory of every guide: header search, filter rail, grouped results (Linear/Composio pattern). */
export function GuidesBrowser({ guides }: { guides: GuideSummary[] }) {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<SourceKey>("all");
  const [level, setLevel] = useState<Level>("any");
  const [sort, setSort] = useState<Sort>("easiest");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const bySource = (k: SourceKey) => guides.filter((g) => k === "all" || g.generatedBy === k);
  const pool = bySource(source);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return guides
      .filter(
        (g) =>
          (source === "all" || g.generatedBy === source) &&
          (level === "any" || g.difficulty === level) &&
          (!needle || `${g.appName} ${g.category} ${g.slug}`.toLowerCase().includes(needle)),
      )
      .sort(SORTS[sort].fn);
  }, [guides, q, source, level, sort]);

  const grouped = source === "all" && level === "any" && !q.trim();
  const reset = () => {
    setQ("");
    setSource("all");
    setLevel("any");
  };

  return (
    <div>
      {/* Header: title left, search right, hairline below */}
      <div className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] sm:text-[40px]">Guides</h1>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-balance text-muted-foreground">See how much work an OAuth app takes before you start.</p>
        </div>
        <label className="relative flex h-10 w-full items-center rounded-full bg-muted/50 ring-1 ring-border focus-within:ring-brand/50 sm:w-72">
          <MagnifyingGlass size={16} className="absolute left-3.5 text-subtle-foreground" />
          <span className="sr-only">Search guides</span>
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-full w-full bg-transparent pr-10 pl-10 text-sm outline-none placeholder:text-subtle-foreground focus-visible:outline-none"
          />
          {q ? (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2.5 flex size-6 items-center justify-center rounded-full text-subtle-foreground hover:bg-muted hover:text-foreground">
              <X size={12} />
            </button>
          ) : (
            <kbd className="absolute right-3 rounded border bg-background px-1.5 font-mono text-[10px] text-subtle-foreground">/</kbd>
          )}
        </label>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        {/* Filter rail: vertical on desktop, horizontal scroll on mobile */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 hidden font-mono text-[11px] tracking-wider text-subtle-foreground uppercase lg:block">Source</p>
          <div className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-0.5 lg:px-0">
            <RailItem active={source === "all"} onClick={() => { setSource("all"); setLevel("any"); }} icon={<SquaresFour size={15} />} label="All guides" count={guides.length} />
            <RailItem active={source === "library"} onClick={() => { setSource("library"); setLevel("any"); }} icon={<SealCheck size={15} weight="fill" className="text-ev-tested" />} label="Library" count={bySource("library").length} />
            <RailItem active={source === "agent"} onClick={() => { setSource("agent"); setLevel("any"); }} icon={<Sparkle size={15} weight="duotone" />} label="AI-generated" count={bySource("agent").length} />
          </div>

          <p className="mt-7 mb-2 hidden font-mono text-[11px] tracking-wider text-subtle-foreground uppercase lg:block">Difficulty</p>
          <div className="-mx-4 mt-2 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:mt-0 lg:block lg:space-y-0.5 lg:px-0">
            <RailItem active={level === "any"} onClick={() => setLevel("any")} icon={<span className="size-1.5 rounded-full bg-border-strong" />} label="Any difficulty" count={pool.length} />
            {LEVELS.filter((l) => pool.some((g) => g.difficulty === l)).map((l) => (
              <RailItem key={l} active={level === l} onClick={() => setLevel(l)} icon={<span className={cn("size-1.5 rounded-full", DOT[l])} />} label={DIFFICULTY_META[l].label} count={pool.filter((g) => g.difficulty === l).length} />
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] tracking-wider text-subtle-foreground uppercase" aria-live="polite">
              Showing {results.length} of {guides.length}
            </p>
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span className="hidden sm:inline">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-8 rounded-lg bg-muted/50 px-2.5 text-[13px] text-foreground ring-1 ring-border outline-none focus-visible:ring-brand/50">
                {(Object.keys(SORTS) as Sort[]).map((k) => (
                  <option key={k} value={k}>
                    {SORTS[k].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl px-6 py-16 text-center ring-1 ring-border">
              <MagnifyingGlass size={26} weight="duotone" className="text-subtle-foreground" />
              <p className="mt-3 text-sm font-medium">No guide matches that</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Our agent can research it for you in about two minutes.</p>
              <div className="mt-5 flex gap-2">
                <Link
                  href={q.trim().length >= 2 ? `/?q=${encodeURIComponent(q.trim())}#generate` : "/#generate"}
                  className="inline-flex h-9 items-center rounded-lg bg-foreground px-3.5 text-sm font-medium text-background hover:opacity-90"
                >
                  {q.trim().length >= 2 ? `Research “${q.trim()}”` : "Research an app"}
                </Link>
                <button type="button" onClick={reset} className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground">
                  Clear filters
                </button>
              </div>
            </div>
          ) : grouped ? (
            <div className="space-y-12">
              {(
                [
                  { key: "library", title: "Library", note: "Researched by hand from each provider’s official docs." },
                  { key: "agent", title: "AI-generated", note: "Researched live by our agent. Every fact says how we know it." },
                ] as const
              ).map((grp) => {
                const items = results.filter((g) => g.generatedBy === grp.key);
                if (!items.length) return null;
                return (
                  <section key={grp.key} aria-labelledby={`grp-${grp.key}`}>
                    <h2 id={`grp-${grp.key}`} className="text-[15px] font-medium">
                      {grp.title}
                    </h2>
                    <p className="mt-0.5 mb-4 text-[13.5px] text-muted-foreground">{grp.note}</p>
                    <Grid items={items} />
                  </section>
                );
              })}
            </div>
          ) : (
            <Grid items={results} />
          )}
        </div>
      </div>
    </div>
  );
}
