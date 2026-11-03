"use client";

import {
  CheckCircle,
  Binoculars,
  Compass,
  FileMagnifyingGlass,
  FloppyDisk,
  Lightbulb,
  MagnifyingGlass,
  ShieldCheck,
  Sparkle,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AppLogo } from "@/components/site/app-logo";
import type { GenerateState, StageLog } from "@/lib/client/useGenerate";
import { STAGES, type Stage } from "@/lib/schema/events.schema";
import { cn } from "@/lib/utils";

const STAGE: Record<Stage, { icon: Icon; title: string; doing: string }> = {
  resolve: { icon: Compass, title: "Resolve", doing: "Checking the name" },
  identify: { icon: MagnifyingGlass, title: "Identify", doing: "Finding the official developer site" },
  research: { icon: FileMagnifyingGlass, title: "Research", doing: "Reading the official docs" },
  probe: { icon: Binoculars, title: "Probe", doing: "Looking at the console, without signing in" },
  synthesise: { icon: Sparkle, title: "Write", doing: "Writing the guide" },
  verify: { icon: ShieldCheck, title: "Verify", doing: "Checking every claim has a source" },
  save: { icon: FloppyDisk, title: "Save", doing: "Saving a shareable link" },
};

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Live run view with a fixed height, so the page never jumps while events stream in:
 * a compact stage rail on the left and an auto-scrolling activity feed on the right.
 */
export function AgentTimeline({ state }: { state: GenerateState }) {
  const feed = STAGES.flatMap((s) => state.logs[s]);
  const active = STAGES.find((s) => state.stages[s] === "active");
  const running = state.status === "running" || state.status === "recovering";
  return (
    <div className="grid grid-cols-1 md:h-[340px] md:grid-cols-[210px_minmax(0,1fr)]">
      <StageRail state={state} />
      <ActivityFeed feed={feed} hint={active && running ? STAGE[active].doing : null} />
    </div>
  );
}

function StageRail({ state }: { state: GenerateState }) {
  const reduce = useReducedMotion();
  const done = STAGES.filter((s) => state.stages[s] === "done").length;
  return (
    <div className="border-b p-4 md:border-r md:border-b-0">
      {/* Mobile: one progress bar instead of seven rows */}
      <div className="md:hidden">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-mono tabular-nums">
            {done}/{STAGES.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-brand" initial={false} animate={{ width: `${(done / STAGES.length) * 100}%` }} transition={{ duration: reduce ? 0 : 0.4, ease }} />
        </div>
      </div>
      <ol className="hidden space-y-1 md:block" aria-label="Agent stages">
        {STAGES.map((stage) => {
          const status = state.stages[stage];
          const meta = STAGE[stage];
          return (
            <li
              key={stage}
              aria-current={status === "active" ? "step" : undefined}
              className={cn("flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] transition-colors", status === "active" && "bg-muted", status === "pending" && "text-subtle-foreground")}
            >
              <span
                className={cn(
                  "relative flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  status === "done" ? "bg-brand text-brand-foreground" : status === "active" ? "text-brand ring-1 ring-brand/60" : "bg-muted",
                )}
              >
                {status === "active" && !reduce && (
                  <motion.span className="absolute inset-0 rounded-full bg-brand/30" animate={{ scale: [1, 1.7], opacity: [0.6, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }} aria-hidden />
                )}
                {status === "done" ? (
                  <motion.span initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 20 }} className="flex">
                    <CheckCircle size={13} weight="fill" />
                  </motion.span>
                ) : (
                  <meta.icon size={11} weight={status === "active" ? "bold" : "regular"} />
                )}
              </span>
              <span className={cn("truncate", status === "active" && "font-medium")}>{meta.title}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ActivityFeed({ feed, hint }: { feed: StageLog[]; hint: string | null }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [feed.length, reduce]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 text-xs text-muted-foreground">
        <span>Live activity</span>
        <span className="font-mono tabular-nums">{feed.length} events</span>
      </div>
      <div ref={ref} className="h-[280px] min-h-0 flex-none overflow-y-auto px-4 pb-4 [mask-image:linear-gradient(to_bottom,transparent,black_18px)] [scrollbar-width:thin] md:h-auto md:flex-1">
        <ul className="space-y-1.5 pt-2" aria-label="Agent activity" aria-live="polite">
          <AnimatePresence initial={false}>
            {feed.map((log, i) => (
              <motion.li
                key={i}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 6, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.28, ease }}
              >
                <FeedItem log={log} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {hint && (
          <div className="mt-2.5 flex items-center gap-2 text-[13px]">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" aria-hidden />
            <Shimmer as="span" duration={1.5}>{hint}</Shimmer>
          </div>
        )}
        {!feed.length && !hint && <p className="pt-2 text-[13px] text-subtle-foreground">Waiting for the first result…</p>}
      </div>
    </div>
  );
}

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-2.5 rounded-lg bg-muted/40 px-2.5 py-2 text-[13px]", className)}>{children}</div>;
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 rounded-md bg-background px-1.5 py-px font-mono text-[10.5px] text-muted-foreground ring-1 ring-border">{children}</span>;
}

function FeedItem({ log }: { log: StageLog }) {
  switch (log.kind) {
    case "search":
      return (
        <Row>
          <Tag>search</Tag>
          <span className="min-w-0 flex-1 truncate">{log.query}</span>
          <span className="shrink-0 font-mono text-[10.5px] text-subtle-foreground">{log.results} results</span>
        </Row>
      );
    case "read":
      return (
        <Row>
          <Tag>read</Tag>
          <AppLogo name={log.domain} website={log.url} size={16} className="rounded-[4px] ring-0" />
          <span className="min-w-0 flex-1 truncate">{log.title}</span>
          <span className="hidden shrink-0 font-mono text-[10.5px] text-subtle-foreground sm:inline">{log.domain}</span>
        </Row>
      );
    case "finding":
      return (
        <Row className="items-start bg-transparent py-1.5">
          <Lightbulb size={14} weight="duotone" className="mt-0.5 shrink-0 text-ev-documented" />
          <span className="min-w-0 flex-1 text-muted-foreground">
            <span className="line-clamp-2">{log.claim}</span>
          </span>
        </Row>
      );
    case "probe":
      return (
        <Row>
          <Tag>probe</Tag>
          <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{log.url.replace(/^https:\/\//, "")}</span>
          <span className={cn("shrink-0 rounded-md px-1.5 py-px text-[10.5px]", log.requiresLogin ? "bg-ev-uncertain/15 text-ev-uncertain" : "bg-ev-tested/15 text-ev-tested")}>
            {log.requiresLogin ? "login wall" : "reachable"}
          </span>
        </Row>
      );
    case "verification":
      return (
        <Row>
          <Tag>verify</Tag>
          <span className="min-w-0 flex-1 truncate">
            {log.downgraded === 0 ? "Every claim kept its label" : `${log.downgraded} claim${log.downgraded > 1 ? "s" : ""} marked as less certain`}
          </span>
        </Row>
      );
  }
}
