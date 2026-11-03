"use client";

import { ArrowsClockwise, MagnifyingGlass, SealCheck, Sparkle, SquaresFour, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GuideCard, GuideCardSkeleton } from "@/components/guides/guide-card";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { DIFFICULTY_META } from "@/lib/format";
import { LEVELS, SORT_LABEL, SORTS, type GuideQuery, type GuideQueryResult, type Level, type Sort, type Source } from "@/lib/guides/query";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

type Filters = Pick<GuideQuery, "q" | "source" | "difficulty" | "sort">;

const DOT: Record<Level, string> = { easy: "bg-diff-easy", moderate: "bg-diff-moderate", hard: "bg-diff-hard", gated: "bg-diff-gated", unknown: "bg-muted-foreground" };
const SOURCE_META: Record<Source, { label: string; icon: React.ReactNode }> = {
  all: { label: "All guides", icon: <SquaresFour size={16} /> },
  library: { label: "Library", icon: <SealCheck size={16} weight="fill" className="text-ev-tested" /> },
  agent: { label: "AI-generated", icon: <Sparkle size={16} weight="duotone" /> },
};

function toParams(f: Filters, offset: number) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.source !== "all") p.set("source", f.source);
  if (f.difficulty !== "any") p.set("difficulty", f.difficulty);
  if (f.sort !== "easiest") p.set("sort", f.sort);
  if (offset) p.set("offset", String(offset));
  return p;
}

function RailItem({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={count === 0 && !active}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors disabled:opacity-40 lg:w-full",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <span className="flex w-4 shrink-0 justify-center">{icon}</span>
      <span className="whitespace-nowrap lg:flex-1 lg:truncate lg:text-left">{label}</span>
      <span className="text-xs text-subtle-foreground tabular-nums">{count}</span>
    </button>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 hidden px-2.5 text-xs font-medium text-subtle-foreground lg:block">{children}</p>;
}

/**
 * Directory of every guide. Results come from /api/guides/search in pages of 24 (server-side
 * filter, sort and facet counts), so the page stays fast with thousands of guides.
 */
export function GuidesBrowser({ initial, initialFilters }: { initial: GuideQueryResult; initialFilters: Filters }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [text, setText] = useState(initialFilters.q);
  const [data, setData] = useState<GuideQueryResult>(initial);
  const [items, setItems] = useState<GuideSummary[]>(initial.items);
  const [status, setStatus] = useState<"idle" | "loading" | "more" | "error">("idle");
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);
  const first = useRef(true);

  const fetchPage = useCallback(async (f: Filters, offset: number) => {
    const id = ++reqId.current;
    setStatus(offset ? "more" : "loading");
    try {
      const res = await fetch(`/api/guides/search?${toParams(f, offset)}`);
      const json = (await res.json()) as { success: boolean; data?: GuideQueryResult };
      if (id !== reqId.current) return; // a newer request superseded this one
      if (!res.ok || !json.success || !json.data) throw new Error("bad response");
      setData(json.data);
      setItems((prev) => (offset ? [...prev, ...json.data!.items] : json.data!.items));
      setStatus("idle");
    } catch {
      if (id === reqId.current) setStatus("error");
    }
  }, []);

  // Refetch page 1 when filters change; keep the URL shareable.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const p = toParams(filters, 0).toString();
    window.history.replaceState(null, "", p ? `/guides?${p}` : "/guides");
    void fetchPage(filters, 0);
  }, [filters, fetchPage]);

  // Debounce typing into the q filter.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === text.trim() ? f : { ...f, q: text.trim() })), 250);
    return () => clearTimeout(t);
  }, [text]);

  // "/" focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "")) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Infinite scroll: load the next page when the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || data.nextOffset === null || status !== "idle") return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && data.nextOffset !== null && void fetchPage(filters, data.nextOffset), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [data.nextOffset, status, filters, fetchPage]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => {
    setText("");
    setFilters({ q: "", source: "all", difficulty: "any", sort: filters.sort });
  };
  const loading = status === "loading";
  const anyFilter = filters.q || filters.source !== "all" || filters.difficulty !== "any";

  return (
    <div>
      <div className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] sm:text-[40px]">Guides</h1>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-balance text-muted-foreground">See how much work an OAuth app takes before you start.</p>
        </div>
        <InputGroup className="h-10 w-full rounded-full sm:w-72">
          <InputGroupAddon>
            <MagnifyingGlass size={16} />
          </InputGroupAddon>
          <InputGroupInput ref={searchRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Search guides" aria-label="Search guides" />
          <InputGroupAddon align="inline-end">
            {loading ? (
              <Spinner className="size-4" />
            ) : text ? (
              <InputGroupButton size="icon-xs" className="rounded-full" aria-label="Clear search" onClick={() => setText("")}>
                <X size={12} />
              </InputGroupButton>
            ) : (
              <Kbd>/</Kbd>
            )}
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Filters">
          <RailLabel>Source</RailLabel>
          <div className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-0.5 lg:px-0">
            {(["all", "library", "agent"] as Source[]).map((s) => (
              <RailItem key={s} active={filters.source === s} onClick={() => set({ source: s })} icon={SOURCE_META[s].icon} label={SOURCE_META[s].label} count={data.facets.source[s]} />
            ))}
          </div>
          <div className="mt-2 lg:mt-7">
            <RailLabel>Difficulty</RailLabel>
            <div className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-0.5 lg:px-0">
              <RailItem
                active={filters.difficulty === "any"}
                onClick={() => set({ difficulty: "any" })}
                icon={<span className="size-1.5 rounded-full bg-border-strong" />}
                label="Any difficulty"
                count={Object.values(data.facets.difficulty).reduce((a, b) => a + b, 0)}
              />
              {LEVELS.map((l) => (
                <RailItem key={l} active={filters.difficulty === l} onClick={() => set({ difficulty: l })} icon={<span className={cn("size-1.5 rounded-full", DOT[l])} />} label={DIFFICULTY_META[l].label} count={data.facets.difficulty[l]} />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {loading ? "Searching…" : `${data.total} guide${data.total === 1 ? "" : "s"}`}
              {anyFilter && !loading && (
                <button type="button" onClick={reset} className="ml-2 text-foreground underline-offset-4 hover:underline">
                  Clear filters
                </button>
              )}
            </p>
            <Select value={filters.sort} onValueChange={(v) => set({ sort: v as Sort })}>
              <SelectTrigger className="h-9 w-40 rounded-lg" aria-label="Sort guides">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SORT_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "error" && items.length === 0 ? (
            <Empty className="rounded-xl border">
              <EmptyHeader>
                <EmptyTitle>Couldn’t load guides</EmptyTitle>
                <EmptyDescription>Check your connection and try again.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={() => void fetchPage(filters, 0)}>
                  <ArrowsClockwise size={14} /> Retry
                </Button>
              </EmptyContent>
            </Empty>
          ) : loading && items.length === 0 ? (
            <ul className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <GuideCardSkeleton />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <Empty className="rounded-xl border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MagnifyingGlass size={20} />
                </EmptyMedia>
                <EmptyTitle>No guide matches that</EmptyTitle>
                <EmptyDescription>Our agent can research it for you in about two minutes.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row justify-center">
                <Button asChild size="sm">
                  <Link href={filters.q.length >= 2 ? `/?q=${encodeURIComponent(filters.q)}#generate` : "/#generate"}>
                    {filters.q.length >= 2 ? `Research “${filters.q}”` : "Research an app"}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                  Clear filters
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <ul className={cn("grid auto-rows-fr grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3", loading && "opacity-50")}>
                {items.map((g) => (
                  <li key={g.slug} className="h-full">
                    <GuideCard g={g} />
                  </li>
                ))}
                {status === "more" &&
                  Array.from({ length: 3 }, (_, i) => (
                    <li key={`sk-${i}`}>
                      <GuideCardSkeleton />
                    </li>
                  ))}
              </ul>
              <div ref={sentinel} className="mt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
                {data.nextOffset !== null ? (
                  <>
                    <span>
                      Showing {items.length} of {data.total}
                    </span>
                    <Button variant="outline" size="sm" disabled={status !== "idle"} onClick={() => void fetchPage(filters, data.nextOffset!)}>
                      {status === "more" ? <Spinner className="size-4" /> : null} Load more
                    </Button>
                  </>
                ) : (
                  items.length > 6 && <span>That’s every guide.</span>
                )}
                {status === "error" && items.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => data.nextOffset !== null && void fetchPage(filters, data.nextOffset)}>
                    <ArrowsClockwise size={14} /> Couldn’t load more. Retry
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
