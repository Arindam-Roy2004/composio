"use client";

import {
  ArrowSquareOut,
  CheckCircle,
  Compass,
  FileMagnifyingGlass,
  FloppyDisk,
  Lightbulb,
  MagnifyingGlass,
  Notebook,
  Binoculars,
  ShieldCheck,
  Sparkle,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtSearchResult, ChainOfThoughtSearchResults } from "@/components/ai-elements/chain-of-thought";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AppLogo } from "@/components/site/app-logo";
import type { GenerateState, StageLog } from "@/lib/client/useGenerate";
import { STAGES, type Stage } from "@/lib/schema/events.schema";
import { cn } from "@/lib/utils";

const STAGE: Record<Stage, { icon: Icon; title: string; active: string; done: string }> = {
  resolve: { icon: Compass, title: "Resolve", active: "Normalising the query and checking the cache", done: "Query resolved" },
  identify: { icon: MagnifyingGlass, title: "Identify", active: "Looking for the official developer domain", done: "Found the developer domain" },
  research: { icon: FileMagnifyingGlass, title: "Research", active: "Reading official docs and noting findings", done: "Research complete" },
  probe: { icon: Binoculars, title: "Probe", active: "Observing the app console without signing in", done: "Console observed" },
  synthesise: { icon: Sparkle, title: "Synthesise", active: "Turning notes into a structured guide", done: "Guide drafted" },
  verify: { icon: ShieldCheck, title: "Verify", active: "Running deterministic evidence checks", done: "Evidence verified" },
  save: { icon: FloppyDisk, title: "Save", active: "Saving to a shareable link", done: "Saved" },
};

const ease = [0.22, 1, 0.36, 1] as const;

/** Live tool-calling view: each stage is a step; each tool call streams in beneath it. */
export function AgentTimeline({ state }: { state: GenerateState }) {
  const reduce = useReducedMotion();
  const doneCount = STAGES.filter((s) => state.stages[s] === "done").length;
  const running = state.status === "running" || state.status === "recovering";

  return (
    <ChainOfThought defaultOpen>
      <ChainOfThoughtHeader className="text-xs">
        {running ? `Step ${Math.min(doneCount + 1, STAGES.length)} of ${STAGES.length}` : `${doneCount} of ${STAGES.length} steps`}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <ol className="space-y-0.5" aria-label="Agent progress" aria-live="polite">
          {STAGES.map((stage, i) => {
            const status = state.stages[stage];
            const meta = STAGE[stage];
            const logs = state.logs[stage];
            const visible = status !== "pending" || (running && STAGES.slice(0, i).every((s) => state.stages[s] === "done"));
            return (
              <motion.li
                key={stage}
                layout={!reduce}
                initial={false}
                animate={{ opacity: status === "pending" ? 0.42 : 1 }}
                transition={{ duration: 0.25, ease }}
                className="relative flex gap-3 pb-3"
              >
                {i < STAGES.length - 1 && (
                  <span className="absolute top-8 bottom-0 left-[13px] w-px overflow-hidden bg-border" aria-hidden>
                    <motion.span
                      className="block w-full bg-brand"
                      initial={false}
                      animate={{ height: status === "done" ? "100%" : "0%" }}
                      transition={{ duration: reduce ? 0 : 0.45, ease }}
                    />
                  </span>
                )}
                <Marker status={status} icon={meta.icon} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-sm font-medium", status === "pending" && "text-subtle-foreground")}>{meta.title}</span>
                    {logs.length > 0 && <span className="font-mono text-[11px] text-subtle-foreground tabular-nums">{logs.length}</span>}
                  </div>
                  {status === "active" ? (
                    <Shimmer as="span" className="text-xs" duration={1.6}>
                      {meta.active}
                    </Shimmer>
                  ) : (
                    <span className="block text-xs text-subtle-foreground">{status === "done" ? meta.done : visible ? meta.active : ""}</span>
                  )}
                  <AnimatePresence initial={false}>
                    {logs.length > 0 && (
                      <motion.div
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.25, ease }}
                        className="overflow-hidden"
                      >
                        <StageLogs logs={logs} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

function Marker({ status, icon: StageIcon }: { status: "pending" | "active" | "done"; icon: Icon }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative z-10 flex size-[27px] shrink-0 items-center justify-center">
      {status === "active" && !reduce && (
        <motion.span
          className="absolute inset-0 rounded-full bg-brand/25"
          animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      )}
      <span
        className={cn(
          "relative flex size-[27px] items-center justify-center rounded-full border bg-background transition-colors duration-300",
          status === "active" && "border-brand/60 text-brand",
          status === "done" && "border-brand/40 bg-brand text-brand-foreground",
          status === "pending" && "text-subtle-foreground",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "done" ? (
            <motion.span key="done" initial={reduce ? false : { scale: 0.3, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 520, damping: 20 }}>
              <CheckCircle size={15} weight="fill" />
            </motion.span>
          ) : (
            <motion.span key="icon" exit={reduce ? undefined : { scale: 0.3, opacity: 0 }} transition={{ duration: 0.12 }}>
              <StageIcon size={14} weight={status === "active" ? "duotone" : "regular"} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

function StageLogs({ logs }: { logs: StageLog[] }) {
  const reduce = useReducedMotion();
  const reads = logs.filter((l): l is Extract<StageLog, { kind: "read" }> => l.kind === "read");
  const rest = logs.filter((l) => l.kind !== "read").slice(-8);
  return (
    <div className="mt-2 space-y-2">
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {rest.map((log, j) => (
            <motion.li
              key={`${log.kind}-${j}-${"query" in log ? log.query : "claim" in log ? log.claim : "url" in log ? log.url : j}`}
              initial={reduce ? false : { opacity: 0, x: -6, filter: "blur(3px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.28, ease }}
            >
              <ToolCall log={log} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {reads.length > 0 && (
        <ChainOfThoughtSearchResults>
          {reads.map((r) => (
            <motion.span key={r.url} initial={reduce ? false : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 28 }}>
              <ChainOfThoughtSearchResult className="max-w-[260px] gap-1.5 rounded-md border bg-muted/50 py-0.5 pr-2 pl-1" title={r.title}>
                <AppLogo name={r.domain} website={r.url} size={16} className="rounded-[4px] border-0" />
                <span className="truncate">{r.title}</span>
              </ChainOfThoughtSearchResult>
            </motion.span>
          ))}
        </ChainOfThoughtSearchResults>
      )}
    </div>
  );
}

function ToolCall({ log }: { log: StageLog }) {
  switch (log.kind) {
    case "search":
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-muted px-1.5 py-px font-mono text-[10.5px] text-muted-foreground">webSearch</span>
          <span className="min-w-0 truncate text-foreground">{log.query}</span>
          <span className="ml-auto shrink-0 font-mono text-[10.5px] text-subtle-foreground">{log.results} results</span>
        </div>
      );
    case "finding":
      return (
        <div className="flex gap-2 text-xs">
          <Lightbulb size={13} weight="duotone" className="mt-px shrink-0 text-ev-documented" />
          <span className="min-w-0 text-muted-foreground">
            <span className="line-clamp-2">{log.claim}</span>
          </span>
        </div>
      );
    case "probe":
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-muted px-1.5 py-px font-mono text-[10.5px] text-muted-foreground">probeConsole</span>
          <span className="min-w-0 truncate font-mono text-[11px]">{log.url.replace(/^https:\/\//, "")}</span>
          <span className={cn("ml-auto shrink-0 rounded px-1.5 py-px text-[10.5px]", log.requiresLogin ? "bg-ev-uncertain/15 text-ev-uncertain" : "bg-ev-tested/15 text-ev-tested")}>
            {log.requiresLogin ? "login wall" : "reachable"}
          </span>
        </div>
      );
    case "verification":
      return (
        <div className="text-xs">
          <div className="flex items-center gap-2">
            <Notebook size={13} weight="duotone" className="text-ev-uncertain" />
            <span>{log.downgraded === 0 ? "Every claim passed" : `${log.downgraded} claim${log.downgraded > 1 ? "s" : ""} downgraded to a weaker label`}</span>
          </div>
          {log.notes.length > 0 && (
            <ul className="mt-1 space-y-0.5 pl-5 text-subtle-foreground">
              {log.notes.slice(0, 4).map((n) => (
                <li key={n} className="truncate">
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "read":
      return (
        <a href={log.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-xs hover:underline">
          {log.title} <ArrowSquareOut size={11} />
        </a>
      );
  }
}
