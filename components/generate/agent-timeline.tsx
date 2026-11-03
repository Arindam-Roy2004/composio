"use client";

import { Check, ChevronRight, CircleDashed, FileText, Lightbulb, Radar, Search, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { GenerateState, StageLog } from "@/lib/client/useGenerate";
import { STAGES, type Stage } from "@/lib/schema/events.schema";
import { cn } from "@/lib/utils";

const LABEL: Record<Stage, { title: string; hint: string }> = {
  resolve: { title: "Resolve", hint: "Normalise the query, check the cache" },
  identify: { title: "Identify", hint: "Find the official developer domain" },
  research: { title: "Research", hint: "Read docs, note findings with sources" },
  probe: { title: "Probe", hint: "Observe the console page without signing in" },
  synthesise: { title: "Synthesise", hint: "Turn notes into a structured guide" },
  verify: { title: "Verify", hint: "Deterministic evidence checks" },
  save: { title: "Save", hint: "Store at a shareable link" },
};

export function AgentTimeline({ state }: { state: GenerateState }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<Partial<Record<Stage, boolean>>>({});

  return (
    <ol className="relative space-y-1" aria-label="Agent progress" aria-live="polite">
      {STAGES.map((stage, i) => {
        const status = state.stages[stage];
        const logs = state.logs[stage];
        const expanded = open[stage] ?? (status === "active" || (stage === "research" && logs.length > 0));
        return (
          <li key={stage} className="relative">
            {i < STAGES.length - 1 && <span className={cn("absolute top-7 left-[13px] h-[calc(100%-12px)] w-px", status === "done" ? "bg-brand/40" : "bg-border")} aria-hidden />}
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [stage]: !expanded }))}
              disabled={!logs.length}
              aria-expanded={logs.length ? expanded : undefined}
              className={cn(
                "relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-1 py-1.5 text-left",
                status === "active" && "bg-muted/60",
              )}
            >
              {status === "active" && !reduce && <span className="shimmer pointer-events-none absolute inset-0" aria-hidden />}
              <StageIcon status={status} />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-medium", status === "pending" && "text-subtle-foreground")}>{LABEL[stage].title}</span>
                <span className="block truncate text-xs text-subtle-foreground">{LABEL[stage].hint}</span>
              </span>
              {logs.length > 0 && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-subtle-foreground">
                  {logs.length}
                  <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} strokeWidth={1.5} />
                </span>
              )}
            </button>
            <AnimatePresence initial={false}>
              {expanded && logs.length > 0 && (
                <motion.ul
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="ml-10 space-y-1 overflow-hidden pb-2"
                >
                  {logs.slice(-12).map((log, j) => (
                    <LogLine key={j} log={log} />
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}

function StageIcon({ status }: { status: "pending" | "active" | "done" }) {
  const reduce = useReducedMotion();
  return (
    <span
      className={cn(
        "relative z-10 flex size-[26px] shrink-0 items-center justify-center rounded-full border bg-background",
        status === "done" && "border-brand/50 bg-brand/15 text-brand",
        status === "active" && "border-brand text-brand",
      )}
    >
      {status === "done" ? (
        <motion.span initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
          <Check className="size-3.5" strokeWidth={2} />
        </motion.span>
      ) : status === "active" ? (
        <CircleDashed className="size-3.5 motion-safe:animate-spin" strokeWidth={1.75} />
      ) : (
        <span className="size-1.5 rounded-full bg-border-strong" />
      )}
    </span>
  );
}

function LogLine({ log }: { log: StageLog }) {
  const base = "flex items-start gap-2 text-xs text-muted-foreground";
  switch (log.kind) {
    case "search":
      return (
        <li className={base}>
          <Search className="mt-0.5 size-3 shrink-0" strokeWidth={1.75} />
          <span className="min-w-0">
            <span className="font-mono text-foreground">“{log.query}”</span> · {log.results} results
          </span>
        </li>
      );
    case "read":
      return (
        <li className={base}>
          <FileText className="mt-0.5 size-3 shrink-0" strokeWidth={1.75} />
          <span className="min-w-0 truncate">
            {log.title} <span className="font-mono text-subtle-foreground">{log.domain}</span>
          </span>
        </li>
      );
    case "finding":
      return (
        <li className={base}>
          <Lightbulb className="mt-0.5 size-3 shrink-0 text-ev-documented" strokeWidth={1.75} />
          <span className="min-w-0 line-clamp-2">{log.claim}</span>
        </li>
      );
    case "probe":
      return (
        <li className={base}>
          <Radar className="mt-0.5 size-3 shrink-0 text-ev-probed" strokeWidth={1.75} />
          <span className="min-w-0 truncate">
            <span className="font-mono">{log.url.replace(/^https:\/\//, "")}</span> · {log.requiresLogin ? "login wall" : "reachable"}
          </span>
        </li>
      );
    case "verification":
      return (
        <li className={base}>
          <ShieldCheck className="mt-0.5 size-3 shrink-0 text-ev-uncertain" strokeWidth={1.75} />
          <span className="min-w-0">
            {log.downgraded === 0 ? "All claims passed verification" : `${log.downgraded} claim${log.downgraded > 1 ? "s" : ""} downgraded`}
            {log.notes.length > 0 && (
              <span className="mt-1 block space-y-0.5 text-subtle-foreground">
                {log.notes.slice(0, 4).map((n) => (
                  <span key={n} className="block truncate">· {n}</span>
                ))}
              </span>
            )}
          </span>
        </li>
      );
  }
}
