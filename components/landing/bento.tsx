"use client";

import { Binoculars, BookOpenText, CheckCircle, Clock, FileMagnifyingGlass, FloppyDisk, HourglassMedium, MagnifyingGlass, Robot, SealCheck, SealQuestion, ShieldCheck, User, UsersThree } from "@phosphor-icons/react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AppLogo } from "@/components/site/app-logo";
import { formatApproval, formatMinutes } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

/* ── shared frame: identical stage, panel and text block for every card ── */

const PANEL = "w-full max-w-[400px] rounded-2xl bg-background p-4 shadow-[0_24px_60px_-32px_oklch(0_0_0/55%)] ring-1 ring-border";

function Card({ title, body, children, className }: { title: string; body: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group flex flex-col overflow-hidden rounded-3xl bg-muted/40 ring-1 ring-border", className)}>
      <div className="flex h-[260px] items-center justify-center px-6 pt-6">{children}</div>
      <div className="px-7 pt-5 pb-7">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function PanelHead({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b pb-3 text-[13px] font-medium">
      {icon}
      {children}
    </div>
  );
}

/* a. active work vs approval wait */
function TimeVisual({ guide }: { guide: Guide }) {
  const a = guide.time.activeSetup;
  return (
    <div className={PANEL}>
      <PanelHead icon={<AppLogo name={guide.appName} website={guide.website} size={22} className="rounded-md" />}>{guide.appName}</PanelHead>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock size={12} /> Active work</p>
          <p className="mt-1.5 text-xl font-semibold tracking-tight">{formatMinutes(a.minMinutes, a.maxMinutes)}</p>
        </div>
        <div className="rounded-xl bg-diff-hard/10 p-3 ring-1 ring-diff-hard/25">
          <p className="flex items-center gap-1 text-[11px] text-diff-hard"><HourglassMedium size={12} /> Approval wait</p>
          <p className="mt-1.5 text-xl font-semibold tracking-tight">{formatApproval(guide.time.approvalWait)}</p>
        </div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className="w-[6%] bg-foreground/70" />
        <span className="stripes flex-1" />
      </div>
      <p className="mt-2 flex justify-between text-[11px] text-subtle-foreground"><span>Your work</span><span>Waiting on review</span></p>
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
    <div className={PANEL}>
      <PanelHead icon={<AppLogo name={guide.appName} website={guide.website} size={22} className="rounded-md" />}>{steps.length} steps, three owners</PanelHead>
      <div className="space-y-1.5">
        {LANES.map((lane) => (
          <div key={lane.id} className="flex items-center gap-2">
            <span className="flex w-[70px] shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <lane.icon size={12} /> {lane.label}
            </span>
            <div className="relative h-8 flex-1 rounded-lg bg-muted/60">
              {steps.map((s, i) =>
                s.owner === lane.id ? (
                  <motion.span
                    key={s.id}
                    initial={{ scale: 0.6, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 24 }}
                    className={cn("absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-background", lane.tone)}
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
    </div>
  );
}

/* c. research loop (illustrates the stages; makes no claims) */
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
    <div ref={ref} className={PANEL}>
      <PanelHead icon={<FileMagnifyingGlass size={16} weight="duotone" className="text-brand" />}>Researching any app</PanelHead>
      <ul className="space-y-2.5">
        {STAGES.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.label} className={cn("flex items-center gap-2.5 text-[13px] transition-opacity duration-300", !done && !active && "opacity-40")}>
              <span className={cn("flex size-5 items-center justify-center rounded-full transition-colors", done ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>
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
  { icon: SealCheck, label: "Tested", cls: "text-ev-tested bg-ev-tested/10" },
  { icon: Binoculars, label: "Probed", cls: "text-ev-probed bg-ev-probed/10" },
  { icon: BookOpenText, label: "Documented", cls: "text-ev-documented bg-ev-documented/10" },
  { icon: UsersThree, label: "Community", cls: "text-ev-community bg-ev-community/10" },
  { icon: SealQuestion, label: "Uncertain", cls: "text-ev-uncertain bg-ev-uncertain/10" },
];

function EvidenceVisual({ guide }: { guide: Guide }) {
  const src = guide.sources[0];
  const claim = guide.nuances[0];
  return (
    <div className={PANEL}>
      <div className="flex flex-wrap gap-1">
        {EV.map((e) => (
          <span key={e.label} className={cn("inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium", e.cls)}>
            <e.icon size={12} weight="duotone" /> {e.label}
          </span>
        ))}
      </div>
      {claim && src && (
        <div className="mt-3 rounded-xl bg-muted/60 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] leading-snug">{claim.title}</p>
            <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-ev-documented/10 px-1.5 text-[11px] font-medium text-ev-documented">
              <BookOpenText size={12} weight="duotone" /> 1
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 border-t pt-2.5 text-xs text-muted-foreground">
            <AppLogo name={src.title} website={src.url} size={18} className="rounded-[5px]" />
            <span className="truncate">{src.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* e. scopes (wide card, text left / visual right) */
const TIER = { basic: "text-ev-tested bg-ev-tested/10", sensitive: "text-diff-moderate bg-diff-moderate/12", restricted: "text-diff-gated bg-diff-gated/12", unknown: "text-muted-foreground bg-muted" } as const;

function ScopesCard({ guide }: { guide: Guide }) {
  return (
    <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-muted/40 p-7 ring-1 ring-border md:col-span-2 md:grid-cols-[1fr_1.25fr]">
      <div>
        <h3 className="text-base font-semibold tracking-tight">Scopes that trigger review, flagged up front</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Every one of Gmail’s read scopes is restricted. You learn that here, not from a rejection email.</p>
      </div>
      <div className={cn(PANEL, "max-w-none")}>
        <PanelHead icon={<AppLogo name={guide.appName} website={guide.website} size={22} className="rounded-md" />}>Gmail API scopes</PanelHead>
        <ul className="divide-y">
          {guide.scopes.slice(0, 5).map((s, i) => (
            <motion.li
              key={s.name}
              initial={{ opacity: 0, x: 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between gap-3 py-2"
            >
              <code className="truncate font-mono text-[12.5px]">{s.name.replace("https://", "")}</code>
              <span className={cn("shrink-0 rounded-md px-1.5 py-px text-[11px] font-medium capitalize", TIER[s.tier])}>{s.tier}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Bento({ gmail, github }: { gmail: Guide; github: Guide }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card title="Active work, separated from approval wait" body="Under an hour of setup can hide six weeks of review. Every guide shows both.">
        <TimeVisual guide={gmail} />
      </Card>
      <Card title="Who does each step" body="You, an agent, or the provider’s review queue. Every hand-off is visible.">
        <LanesVisual guide={gmail} />
      </Card>
      <Card title="Research you can watch" body="Type any app. An agent reads the docs and probes the console on a fixed budget.">
        <RunVisual />
      </Card>
      <Card title="A label on every claim" body="Tested, probed, documented, community or uncertain, with the source one hover away.">
        <EvidenceVisual guide={github} />
      </Card>
      <ScopesCard guide={gmail} />
    </div>
  );
}
