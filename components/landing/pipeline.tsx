"use client";

import { Binoculars, BookOpenText, FileText, MagnifyingGlass, ShieldCheck, TextT } from "@phosphor-icons/react";
import { useRef } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

const STAGES = [
  { icon: MagnifyingGlass, title: "Research", body: "Searches, then reads the provider’s official docs before any forum. Every finding is noted with the page it came from." },
  { icon: Binoculars, title: "Probe", body: "Opens the app console URL and records only what it can see, such as a login wall or form fields. It never signs in or submits anything." },
  { icon: ShieldCheck, title: "Verify", body: "Plain code, not another model. Unsourced claims become “uncertain”, “documented” needs an official source, timelines need a citation." },
  { icon: BookOpenText, title: "Share", body: "A stable link with dates, sources, and an explicit list of what couldn’t be confirmed." },
];

function Node({ refEl, className, children, label }: { refEl: React.RefObject<HTMLDivElement | null>; className?: string; children: React.ReactNode; label: string }) {
  return (
    <div ref={refEl} aria-label={label} className={cn("z-10 flex items-center justify-center rounded-2xl border bg-card shadow-card", className)}>
      {children}
    </div>
  );
}

/** Animated beams from your query through the pipeline into a guide. */
export function Pipeline() {
  const container = useRef<HTMLDivElement>(null);
  const q = useRef<HTMLDivElement>(null);
  const out = useRef<HTMLDivElement>(null);
  const n0 = useRef<HTMLDivElement>(null);
  const n1 = useRef<HTMLDivElement>(null);
  const n2 = useRef<HTMLDivElement>(null);
  const n3 = useRef<HTMLDivElement>(null);
  const mids = [n0, n1, n2, n3];

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
      <div ref={container} className="relative flex h-[320px] items-center justify-between px-2 sm:px-6" aria-hidden>
        <Node refEl={q} label="Your query" className="size-16 rounded-full">
          <TextT size={24} weight="duotone" className="text-muted-foreground" />
        </Node>
        <div className="flex h-full flex-col justify-between py-2">
          {STAGES.map((s, i) => (
            <Node key={s.title} refEl={mids[i]!} label={s.title} className="size-12">
              <s.icon size={20} weight="duotone" className="text-brand" />
            </Node>
          ))}
        </div>
        <Node refEl={out} label="Guide" className="size-16">
          <FileText size={26} weight="duotone" className="text-foreground" />
        </Node>
        {mids.map((m, i) => (
          <AnimatedBeam key={`a${i}`} containerRef={container} fromRef={q} toRef={m} curvature={(1.5 - i) * 30} duration={4} delay={i * 0.25} gradientStartColor="var(--brand)" gradientStopColor="var(--ev-probed)" pathColor="var(--border-strong)" />
        ))}
        {mids.map((m, i) => (
          <AnimatedBeam key={`b${i}`} containerRef={container} fromRef={m} toRef={out} curvature={(1.5 - i) * 30} duration={4} delay={1 + i * 0.25} gradientStartColor="var(--ev-probed)" gradientStopColor="var(--brand)" pathColor="var(--border-strong)" />
        ))}
      </div>
      <ol className="space-y-6">
        {STAGES.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="font-mono text-xs text-subtle-foreground tabular-nums">0{i + 1}</span>
            <div>
              <h3 className="text-[15px] font-medium tracking-tight">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
