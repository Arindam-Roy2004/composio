"use client";

import { ArrowRight, CircleAlert, Loader2, RotateCcw, Timer } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AgentTimeline } from "@/components/generate/agent-timeline";
import { SourceTicker } from "@/components/generate/source-ticker";
import { Button } from "@/components/ui/button";
import { useGenerate } from "@/lib/client/useGenerate";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = ["Zoom", "Calendly", "figma.com", "Airtable", "HubSpot", "Dropbox", "Spotify"];
const CHIPS = ["Zoom", "Calendly", "Figma", "Airtable"];

export function GenerateBox() {
  const params = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(() => params.get("q") ?? "");
  const [forceRefresh, setForceRefresh] = useState(() => params.get("refresh") === "1");
  const [ph, setPh] = useState(0);
  const { state, start, reset } = useGenerate();
  const running = state.status === "running" || state.status === "recovering";

  useEffect(() => {
    const id = setInterval(() => setPh((i) => (i + 1) % PLACEHOLDERS.length), 2400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reduce]);

  useEffect(() => {
    if (params.get("q")) inputRef.current?.focus();
  }, [params]);

  // Hand off to the guide page once ready.
  useEffect(() => {
    if (state.status !== "done" || !state.result) return;
    const t = setTimeout(() => router.push(state.result!.url), state.result.cached ? 150 : 900);
    return () => clearTimeout(t);
  }, [state.status, state.result, router]);

  const submit = (q = value) => {
    const query = q.trim();
    if (query.length < 2 || running) return;
    setValue(query);
    void start(query, forceRefresh);
    setForceRefresh(false);
  };

  return (
    <div id="generate" className="scroll-mt-24">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="group relative rounded-2xl border bg-card/80 p-2 shadow-card backdrop-blur transition-[border-color,box-shadow] focus-within:border-brand/50 focus-within:shadow-glow"
      >
        <label htmlFor="generate-input" className="sr-only">
          App name or website
        </label>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id="generate-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            disabled={running}
            placeholder={`Try “${PLACEHOLDERS[ph]}”`}
            className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-subtle-foreground disabled:opacity-60 focus-visible:outline-none"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">⌘K</kbd>
          <Button type="submit" size="lg" disabled={running || value.trim().length < 2} className="h-10 rounded-xl px-4">
            {running ? <Loader2 className="animate-spin" strokeWidth={1.75} /> : <ArrowRight strokeWidth={1.75} />}
            <span className="hidden sm:inline">{running ? "Researching" : "Generate guide"}</span>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t px-2 pt-2 pb-0.5">
          <span className="text-xs text-subtle-foreground">Examples</span>
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={running}
              onClick={() => submit(c)}
              className="rounded-md border bg-background/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-50"
            >
              {c}
            </button>
          ))}
          {forceRefresh && <span className="ml-auto text-xs text-ev-uncertain">Will re-run research</span>}
        </div>
      </form>

      <AnimatePresence>
        {state.status !== "idle" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 4 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 rounded-2xl border bg-card p-4 text-left sm:p-5"
          >
            <RunHeader state={state} onReset={reset} onRetry={() => submit(state.query)} />
            {state.status === "error" ? null : (
              <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
                <AgentTimeline state={state} />
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-subtle-foreground uppercase">Sources</p>
                    <SourceTicker reads={state.reads} />
                  </div>
                  {state.budget && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-subtle-foreground uppercase">Budget</p>
                      <Meter label="Tool calls" value={state.budget.toolCalls} max={state.budget.maxToolCalls} />
                      <Meter label="Pages read" value={state.budget.pagesRead} max={state.budget.maxPages} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RunHeader({ state, onReset, onRetry }: { state: ReturnType<typeof useGenerate>["state"]; onReset: () => void; onRetry: () => void }) {
  const elapsed = useElapsed(state.startedAt, state.finishedAt);
  if (state.status === "error" && state.error) {
    return <ErrorState error={state.error} onRetry={onRetry} onReset={onReset} />;
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {state.status === "done" ? (state.result?.cached ? "Found an existing guide" : "Guide ready, opening…") : state.status === "recovering" ? "Connection dropped, checking for the saved guide…" : `Researching ${state.query}`}
        </p>
        <p className="text-xs text-subtle-foreground">
          {state.status === "running" && "Usually 60–120 seconds. You can leave this page; the guide will still be saved."}
          {state.status === "done" && state.result && `/guide/${state.result.slug}`}
        </p>
      </div>
      <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums" aria-label="Elapsed time">
        <Timer className="size-3.5" strokeWidth={1.5} />
        {elapsed}s
      </span>
    </div>
  );
}

function ErrorState({ error, onRetry, onReset }: { error: NonNullable<ReturnType<typeof useGenerate>["state"]["error"]>; onRetry: () => void; onReset: () => void }) {
  const [left, setLeft] = useState(error.retryAfter ?? 0);
  useEffect(() => {
    if (!error.retryAfter) return;
    setLeft(error.retryAfter);
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [error.retryAfter]);
  const limited = Boolean(error.retryAfter);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center" role="alert">
      <CircleAlert className={cn("size-5 shrink-0", limited ? "text-ev-uncertain" : "text-destructive")} strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{limited ? "Slow down a little" : "That didn’t work"}</p>
        <p className="text-xs text-muted-foreground">
          {error.message}
          {limited && left > 0 && <span className="font-mono"> Try again in {left >= 60 ? `${Math.ceil(left / 60)} min` : `${left}s`}.</span>}
        </p>
      </div>
      <div className="flex gap-2">
        {!error.fields && (
          <Button size="sm" variant="outline" onClick={onRetry} disabled={limited && left > 0}>
            <RotateCcw strokeWidth={1.5} /> Retry
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onReset}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemax={max}>
        <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function useElapsed(start: number | null, end: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!start || end) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [start, end]);
  if (!start) return 0;
  return Math.max(0, Math.floor(((end ?? now) - start) / 1000));
}
