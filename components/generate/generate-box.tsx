"use client";

import {
  ArrowClockwise,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Clock,
  CloudSlash,
  Hourglass,
  Lightning,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AgentTimeline } from "@/components/generate/agent-timeline";
import { AppLogo } from "@/components/site/app-logo";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { useGenerate, type GenerateState } from "@/lib/client/useGenerate";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  { name: "Zoom", site: "https://zoom.us" },
  { name: "Calendly", site: "https://calendly.com" },
  { name: "Figma", site: "https://figma.com" },
  { name: "Airtable", site: "https://airtable.com" },
];
const TYPED = ["Zoom", "calendly.com", "Figma", "HubSpot", "Airtable", "dropbox.com"];
const ease = [0.22, 1, 0.36, 1] as const;

/** Types and deletes example names into the placeholder, like a prompt being written. */
function useTypewriter(words: string[], enabled: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let w = 0;
    let i = 0;
    let deleting = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = words[w]!;
      i += deleting ? -1 : 1;
      setText(word.slice(0, i));
      let delay = deleting ? 45 : 85;
      if (!deleting && i === word.length) {
        deleting = true;
        delay = 1600;
      } else if (deleting && i === 0) {
        deleting = false;
        w = (w + 1) % words.length;
        delay = 300;
      }
      t = setTimeout(tick, delay);
    };
    t = setTimeout(tick, 600);
    return () => clearTimeout(t);
  }, [words, enabled]);
  return text;
}

export function GenerateBox() {
  const params = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(() => params.get("q") ?? "");
  const [forceRefresh, setForceRefresh] = useState(() => params.get("refresh") === "1");
  const [focused, setFocused] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [online, setOnline] = useState(true);
  const { state, start, reset } = useGenerate();
  const running = state.status === "running" || state.status === "recovering";
  const typed = useTypewriter(TYPED, !value && !focused && !reduce);
  const fieldError = state.status === "error" && state.error?.fields ? state.error.message : null;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current && !running) {
        setValue("");
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reduce, running, reset]);

  useEffect(() => {
    if (params.get("q")) inputRef.current?.focus();
  }, [params]);

  useEffect(() => {
    if (fieldError) setShaking(true);
  }, [fieldError]);

  useEffect(() => {
    if (state.status !== "done" || !state.result) return;
    const t = setTimeout(() => router.push(state.result!.url), state.result.cached ? 450 : 1100);
    return () => clearTimeout(t);
  }, [state.status, state.result, router]);

  const submit = (q = value) => {
    const query = q.trim();
    if (running) return;
    if (query.length < 2) {
      setShaking(true);
      inputRef.current?.focus();
      return;
    }
    setValue(query);
    void start(query, forceRefresh);
    setForceRefresh(false);
  };

  const canSubmit = value.trim().length >= 2 && !running && online;

  return (
    <div id="generate" className="relative scroll-mt-28 text-left">
      <motion.form
        onAnimationEnd={() => setShaking(false)}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          "hairline-gradient inner-highlight relative overflow-hidden rounded-2xl transition-shadow duration-300",
          shaking && !reduce && "animate-shake",
          (focused || running) && "shadow-glow",
        )}
        aria-describedby={fieldError ? "generate-error" : undefined}
      >
        {(focused || running) && !reduce && (
          <>
            <BorderBeam size={120} duration={running ? 3.5 : 7} colorFrom="var(--brand)" colorTo="transparent" borderWidth={1.5} />
            <BorderBeam size={120} duration={running ? 3.5 : 7} delay={running ? 1.75 : 3.5} colorFrom="var(--brand)" colorTo="transparent" borderWidth={1.5} />
          </>
        )}
        <label htmlFor="generate-input" className="sr-only">
          App name or website to research
        </label>
        <div className="relative px-4 pt-4 pb-2">
          <input
            ref={inputRef}
            id="generate-input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (state.status === "error") reset();
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            disabled={running}
            aria-invalid={Boolean(fieldError)}
            placeholder={reduce || focused ? "App name or website, e.g. Zoom or calendly.com" : ""}
            className="peer h-9 w-full bg-transparent text-[17px] tracking-tight outline-none placeholder:text-subtle-foreground focus-visible:outline-none disabled:cursor-progress disabled:opacity-70"
          />
          {!value && !focused && !reduce && (
            <span className="pointer-events-none absolute top-4 left-4 flex h-9 items-center text-[17px] tracking-tight text-subtle-foreground" aria-hidden>
              Research&nbsp;<span className="text-muted-foreground">{typed}</span>
              <span className="ml-px inline-block h-5 w-px bg-muted-foreground motion-safe:animate-caret" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 px-2.5 pb-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.name}
                type="button"
                disabled={running}
                onClick={() => submit(ex.name)}
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg border bg-background/40 pr-2.5 pl-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <AppLogo name={ex.name} website={ex.site} size={16} className="rounded-[4px] border-0 bg-transparent" />
                {ex.name}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {forceRefresh && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setForceRefresh(false)}
                className="hidden h-7 shrink-0 items-center gap-1 rounded-lg bg-ev-uncertain/12 px-2 text-xs text-ev-uncertain sm:flex"
                title="This run will ignore the cached guide. Click to cancel."
              >
                <ArrowClockwise size={13} weight="bold" /> Fresh run <X size={11} />
              </motion.button>
            )}
          </AnimatePresence>
          <span className="hidden shrink-0 items-center gap-1 text-[11px] text-subtle-foreground md:flex">
            <kbd className="rounded border bg-muted px-1 font-mono">⌘K</kbd>
          </span>
          <Button
            type="submit"
            size="icon"
            disabled={!canSubmit}
            aria-label={running ? "Researching" : "Generate guide"}
            className="size-9 shrink-0 rounded-xl bg-brand text-brand-foreground shadow-[0_0_0_1px_var(--brand-ring),0_6px_20px_-6px_var(--brand-glow)] hover:bg-brand/90 disabled:bg-muted disabled:text-subtle-foreground disabled:shadow-none"
          >
            {running ? (
              <motion.span animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="flex">
                <Hourglass size={17} weight="bold" />
              </motion.span>
            ) : (
              <ArrowUp size={17} weight="bold" />
            )}
          </Button>
        </div>
      </motion.form>

      <div className="mt-2 min-h-5 px-1 text-xs" aria-live="polite">
        {fieldError ? (
          <p id="generate-error" className="flex items-center gap-1.5 text-destructive">
            <WarningCircle size={14} weight="fill" /> {fieldError}
          </p>
        ) : !online ? (
          <p className="flex items-center gap-1.5 text-ev-uncertain">
            <CloudSlash size={14} weight="duotone" /> You’re offline. Library guides you’ve opened may still load.
          </p>
        ) : null}
      </div>

      <AnimatePresence mode="popLayout">
        {state.status !== "idle" && !fieldError && (
          <motion.div
            key="run"
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.35, ease }}
            className="hairline-gradient inner-highlight relative mt-3 overflow-hidden rounded-2xl"
          >
            {running && !reduce && <BorderBeam size={180} duration={5} colorFrom="var(--brand)" colorTo="transparent" borderWidth={1} />}
            <RunPanel state={state} onRetry={() => submit(state.query)} onDismiss={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RunPanel({ state, onRetry, onDismiss }: { state: GenerateState; onRetry: () => void; onDismiss: () => void }) {
  const elapsed = useElapsed(state.startedAt, state.finishedAt);
  const site = state.reads[0]?.url;

  if (state.status === "error" && state.error) return <ErrorPanel error={state.error} onRetry={onRetry} onDismiss={onDismiss} />;

  return (
    <div>
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {site ? <AppLogo name={state.query} website={site} size={28} /> : <span className="flex size-7 items-center justify-center rounded-lg border bg-muted text-xs font-medium">{state.query.charAt(0).toUpperCase()}</span>}
        <div className="min-w-0 flex-1">
          {state.status === "done" ? (
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle size={16} weight="fill" className="text-ev-tested" />
              {state.result?.cached ? "Already researched. Opening the guide" : "Guide ready. Opening it now"}
            </p>
          ) : state.status === "recovering" ? (
            <Shimmer as="p" className="text-sm font-medium">
              Connection dropped. Waiting for the saved guide…
            </Shimmer>
          ) : (
            <Shimmer as="p" className="text-sm font-medium" duration={1.8}>
              {`Researching ${state.query}`}
            </Shimmer>
          )}
          <p className="truncate text-xs text-subtle-foreground">
            {state.status === "done" && state.result ? `/guide/${state.result.slug}` : "You can leave this page. The guide is saved either way."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {state.budget && <BudgetRing used={state.budget.toolCalls} max={state.budget.maxToolCalls} pages={state.budget.pagesRead} maxPages={state.budget.maxPages} />}
          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums" aria-label={`Elapsed ${elapsed} seconds`}>
            <Clock size={13} />
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>
      {state.status === "done" && state.result?.cached ? (
        <div className="px-4 py-4 text-sm text-muted-foreground">This app is already in the library or was generated earlier, so no new research was needed.</div>
      ) : (
        <AgentTimeline state={state} />
      )}
      {state.status === "done" && (
        <div className="h-0.5 bg-muted">
          <motion.div className="h-full bg-brand" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: state.result?.cached ? 0.45 : 1.1, ease: "linear" }} />
        </div>
      )}
    </div>
  );
}

function BudgetRing({ used, max, pages, maxPages }: { used: number; max: number; pages: number; maxPages: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, used / max);
  return (
    <span className="flex items-center gap-1.5" title={`Budget used: ${used}/${max} tool calls, ${pages}/${maxPages} pages read`}>
      <svg viewBox="0 0 24 24" className="size-6 -rotate-90" aria-hidden>
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--muted)" strokeWidth="2.5" />
        <motion.circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={pct > 0.8 ? "var(--ev-uncertain)" : "var(--brand)"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.4, ease }}
        />
      </svg>
      <span className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline">
        {used}/{max}
      </span>
      <span className="sr-only">
        Budget used: {used} of {max} tool calls
      </span>
    </span>
  );
}

function ErrorPanel({ error, onRetry, onDismiss }: { error: NonNullable<GenerateState["error"]>; onRetry: () => void; onDismiss: () => void }) {
  const [left, setLeft] = useState(error.retryAfter ?? 0);
  useEffect(() => {
    if (!error.retryAfter) return;
    setLeft(error.retryAfter);
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [error.retryAfter]);
  const limited = Boolean(error.retryAfter);
  const total = error.retryAfter ?? 1;

  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center" role="alert">
      <span className={cn("relative flex size-10 shrink-0 items-center justify-center rounded-xl", limited ? "bg-ev-uncertain/12 text-ev-uncertain" : "bg-destructive/12 text-destructive")}>
        {limited ? <Lightning size={20} weight="duotone" /> : <WarningCircle size={20} weight="duotone" />}
        {limited && left > 0 && (
          <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeOpacity="0.9" strokeWidth="1.5" strokeDasharray={116.2} strokeDashoffset={116.2 * (1 - left / total)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{limited ? "You’ve hit the research limit" : "That run didn’t finish"}</p>
        <p className="text-xs text-muted-foreground">
          {error.message}
          {limited && left > 0 && <span className="font-mono text-foreground"> Try again in {left >= 60 ? `${Math.ceil(left / 60)} min` : `${left}s`}.</span>}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onRetry} disabled={limited && left > 0} className="rounded-lg">
          <ArrowClockwise size={14} /> Retry
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} className="rounded-lg">
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function GenerateCta({ className }: { className?: string }) {
  return (
    <a href="#generate" className={cn("inline-flex items-center gap-1 text-sm text-brand hover:underline", className)}>
      Research another app <ArrowRight size={14} />
    </a>
  );
}

function formatElapsed(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
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
