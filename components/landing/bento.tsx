"use client";

import { Binoculars, BookOpenText, CheckCircle, Clock, FileMagnifyingGlass, FloppyDisk, HourglassMedium, MagnifyingGlass, Robot, SealCheck, SealQuestion, ShieldCheck, User, UsersThree } from "@phosphor-icons/react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AppLogo } from "@/components/site/app-logo";
import { formatApproval, formatMinutes } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

function Card({ title, body, children, className, visualClass }: { title: string; body: string; children: React.ReactNode; className?: string; visualClass?: string }) {
  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-3xl bg-muted/40 ring-1 ring-border", className)}>
      <div className={cn("relative flex h-64 items-center overflow-hidden px-6", visualClass)}>{children}</div>
      <div className="px-6 pt-2 pb-6">
        <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

/* a. active work vs approval wait */
function TimeVisual({ guide }: { guide: Guide }) {
  const a = guide.time.activeSetup;
  const w = guide.time.approvalWait;
  return (
    <div className="w-full rotate-[-2deg] transition-transform duration-500 group-hover:rotate-0">
      <div className="rounded-2xl bg-background p-4 shadow-[0_24px_60px_-24px_oklch(0_0_0/50%)] ring-1 ring-border">
        <div className="flex items-center gap-2.5">
          <AppLogo name={guide.appName} website={guide.website} size={28} />
          <span className="text-sm font-medium">{guide.appName}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock size={12} /> Active work</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{formatMinutes(a.minMinutes, a.maxMinutes)}</p>
          </div>
          <div className="rounded-xl bg-diff-hard/10 p-3 ring-1 ring-diff-hard/25">
            <p className="flex items-center gap-1 text-[11px] text-diff-hard"><HourglassMedium size={12} /> Approval wait</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{formatApproval(w)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* b. owner lanes */
const LANES = [
  { id: "human", label: "You", icon: User, tone: "bg-own-human" },
  { id: "agent", label: "Agent", icon: Robot, tone: "bg-own-agent" },
  { id: "provider", label: "Provider", icon: HourglassMedium, tone: "bg-own-provider" },
] as const;

function LanesVisual({ guide }: { guide: Guide }) {
  const steps = [...guide.steps].sort((a, b) => a.order - b.order);
  return (
    <div className="w-full space-y-2">
      {LANES.map((lane) => (
        <div key={lane.id} className="flex items-center gap-2">
          <span className="flex w-16 shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            <lane.icon size={12} /> {lane.label}
          </span>
          <div className="relative flex h-9 flex-1 items-center rounded-lg bg-background ring-1 ring-border">
            {steps.map((s, i) =>
              s.owner === lane.id ? (
                <motion.span
                  key={s.id}
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 24 }}
                  className={cn("absolute flex size-6 -translate-x-1/2 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-background", lane.tone)}
                  style={{ left: `${((i + 0.5) / steps.length) * 100}%` }}
                >
                  {s.order}
                </motion.span>
              ) : null,
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* c. live research loop (illustrative stage progression, no claims) */
const STAGES = [
  { icon: MagnifyingGlass, label: "Identify the developer domain" },
  { icon: FileMagnifyingGlass, label: "Read the official docs" },
  { icon: Binoculars, label: "Probe the console, no sign-in" },
  { icon: ShieldCheck, label: "Verify every label" },
  { icon: FloppyDisk, label: "Save a shareable guide" },
];

function RunVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? STAGES.length : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => setStep((s) => (s >= STAGES.length + 1 ? 0 : s + 1)), 1100);
    return () => clearInterval(id);
  }, [inView, reduce]);
  return (
    <div ref={ref} className="w-full rounded-2xl bg-background p-4 ring-1 ring-border">
      <ul className="space-y-2.5">
        {STAGES.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.label} className={cn("flex items-center gap-2.5 text-[13px] transition-opacity", !done && !active && "opacity-40")}>
              <span className={cn("flex size-5 items-center justify-center rounded-full", done ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>
                {done ? <CheckCircle size={13} weight="fill" /> : <s.icon size={11} />}
              </span>
              {active ? <Shimmer as="span" duration={1.4}>{s.label}</Shimmer> : <span>{s.label}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* d. evidence */
const EV = [
  { icon: SealCheck, label: "Tested", cls: "text-ev-tested bg-ev-tested/10 ring-ev-tested/30" },
  { icon: Binoculars, label: "Probed", cls: "text-ev-probed bg-ev-probed/10 ring-ev-probed/30" },
  { icon: BookOpenText, label: "Documented", cls: "text-ev-documented bg-ev-documented/10 ring-ev-documented/30" },
  { icon: UsersThree, label: "Community", cls: "text-ev-community bg-ev-community/10 ring-ev-community/30" },
  { icon: SealQuestion, label: "Uncertain", cls: "text-ev-uncertain ring-ev-uncertain/40 ring-dashed" },
];

function EvidenceVisual({ guide }: { guide: Guide }) {
  const src = guide.sources[0];
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1.5">
        {EV.map((e) => (
          <span key={e.label} className={cn("inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium ring-1", e.cls)}>
            <e.icon size={13} weight="duotone" /> {e.label}
          </span>
        ))}
      </div>
      {src && (
        <div className="mt-4 rounded-2xl bg-background p-3.5 shadow-[0_24px_60px_-24px_oklch(0_0_0/50%)] ring-1 ring-border transition-transform duration-500 group-hover:-translate-y-1">
          <p className="text-[13px] leading-snug">{guide.nuances[0]?.title}</p>
          <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
            <AppLogo name={src.title} website={src.url} size={18} className="rounded-md" />
            <span className="truncate">{src.title}</span>
            <span className="ml-auto shrink-0 rounded-md bg-ev-documented/10 px-1.5 py-px text-[10.5px] text-ev-documented">Official docs</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* e. scopes */
const TIER = { basic: "text-ev-tested bg-ev-tested/10", sensitive: "text-diff-moderate bg-diff-moderate/12", restricted: "text-diff-gated bg-diff-gated/12", unknown: "text-muted-foreground bg-muted" } as const;

function ScopesVisual({ guide }: { guide: Guide }) {
  return (
    <div className="flex w-full flex-wrap content-start gap-2">
      {guide.scopes.map((s, i) => (
        <motion.span
          key={s.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="inline-flex items-center gap-2 rounded-xl bg-background py-2 pr-2 pl-3 ring-1 ring-border"
        >
          <code className="font-mono text-[12.5px]">{s.name.replace("https://", "")}</code>
          <span className={cn("rounded-md px-1.5 py-px text-[10.5px] font-medium capitalize", TIER[s.tier])}>{s.tier}</span>
        </motion.span>
      ))}
    </div>
  );
}

export function Bento({ gmail, github }: { gmail: Guide; github: Guide }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card title="Active work, separated from approval wait" body="Ten minutes of forms can hide six weeks of review. Every guide shows both numbers.">
        <TimeVisual guide={gmail} />
      </Card>
      <Card title="Who does each step" body="You, an agent, or the provider’s review queue. See every hand-off before you start.">
        <LanesVisual guide={gmail} />
      </Card>
      <Card title="Research you can watch" body="Type any app. An agent reads the docs and probes the console, on a fixed budget.">
        <RunVisual />
      </Card>
      <Card title="A label on every claim" body="Tested, probed, documented, community or uncertain, with the source one hover away.">
        <EvidenceVisual guide={github} />
      </Card>
      <Card className="md:col-span-2" visualClass="h-44" title="Scopes that trigger review, flagged up front" body="Gmail’s read scopes are all restricted. You find that out here, not in a rejection email.">
        <ScopesVisual guide={gmail} />
      </Card>
    </div>
  );
}
