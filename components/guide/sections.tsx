"use client";

import { ArrowSquareOut, ArrowUpRight, Check, Copy, Hash, Question, Robot, User, Warning } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { EvidenceBadge } from "@/components/guide/evidence-badge";
import { OwnerBadge } from "@/components/guide/owner-badge";
import { Prose } from "@/components/guide/prose";
import { AppLogo } from "@/components/site/app-logo";
import { domainOf, formatDate } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

/* ── Surfaces ─────────────────────────────────────────────────────────────── */

/** Muted outer tray holding inner cards (docs-style nested surface). */
export function Tray({ label, meta, children, className }: { label?: React.ReactNode; meta?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-muted/40 p-1.5 ring-1 ring-border", className)}>
      {(label || meta) && (
        <div className="flex items-center justify-between gap-3 px-3 pt-1.5 pb-2.5 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">{label}</span>
          {meta && <span className="shrink-0 font-mono tabular-nums">{meta}</span>}
        </div>
      )}
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export function Inner({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={cn("rounded-xl bg-background ring-1 ring-border", className)}>
      {children}
    </div>
  );
}

export function Section({ id, title, description, children, className }: { id: string; title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-24", className)}>
      <h2 id={`${id}-title`} className="group flex items-center gap-2 text-xl font-semibold tracking-[-0.02em]">
        {title}
        <a href={`#${id}`} className="text-subtle-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Link to ${title}`}>
          <Hash size={16} />
        </a>
      </h2>
      {description && <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StepNumber({ n }: { n: number }) {
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] text-muted-foreground ring-1 ring-border">{String(n).padStart(2, "0")}</span>;
}

function CopyRow({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 py-1.5 pr-1.5 pl-3 ring-1 ring-border">
      <a href={value} target="_blank" rel="noopener noreferrer nofollow" className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-brand hover:underline">
        {value.replace(/^https:\/\//, "")}
      </a>
      <button
        type="button"
        aria-label="Copy URL"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1200);
          } catch {
            toast.error("Couldn’t access the clipboard");
          }
        }}
        className="flex size-7 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        {done ? <Check size={14} weight="bold" className="text-ev-tested" /> : <Copy size={14} />}
      </button>
      <a href={value} target="_blank" rel="noopener noreferrer nofollow" aria-label="Open in new tab" className="flex size-7 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-background hover:text-foreground">
        <ArrowSquareOut size={14} />
      </a>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl px-4 py-6 text-center text-sm text-subtle-foreground">{children}</p>;
}

/* ── Sections ─────────────────────────────────────────────────────────────── */

const KIND_LABEL = { account: "Account", domain: "Domain", legal: "Legal", business: "Business", payment: "Payment", technical: "Technical", other: "Other" } as const;

export function Prerequisites({ guide }: { guide: Guide }) {
  const key = `prereq:${guide.slug}`;
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* storage unavailable: the checklist still works for this visit */
    }
  }, [key]);
  const toggle = (id: string, value: boolean) =>
    setDone((prev) => {
      const next = { ...prev, [id]: value };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  if (!guide.prerequisites.length) return <Tray><Inner><Empty>No prerequisites found beyond an account.</Empty></Inner></Tray>;
  const count = guide.prerequisites.filter((p) => done[p.id]).length;
  return (
    <Tray label="Checklist" meta={`${count}/${guide.prerequisites.length} done`}>
      <Inner className="divide-y">
        {guide.prerequisites.map((p) => (
          <label key={p.id} htmlFor={`pre-${p.id}`} className="flex cursor-pointer gap-3 p-4 transition-colors hover:bg-muted/30">
            <Checkbox id={`pre-${p.id}`} checked={Boolean(done[p.id])} onCheckedChange={(v) => toggle(p.id, v === true)} className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className={cn("text-sm font-medium", done[p.id] && "text-muted-foreground line-through")}>{p.label}</span>
                <span className="rounded-md bg-muted px-1.5 py-px text-[10.5px] text-muted-foreground">{KIND_LABEL[p.kind]}</span>
              </span>
              <Prose className="mt-1">{p.detail}</Prose>
            </span>
            <EvidenceBadge evidence={p.evidence} sourceIds={p.sourceIds} className="self-start" />
          </label>
        ))}
      </Inner>
    </Tray>
  );
}

export function StepList({ guide }: { guide: Guide }) {
  const blockersByStep = new Map<string, Guide["blockers"]>();
  for (const b of guide.blockers) if (b.stepId) blockersByStep.set(b.stepId, [...(blockersByStep.get(b.stepId) ?? []), b]);
  const steps = [...guide.steps].sort((a, b) => a.order - b.order);
  return (
    <Tray>
      {steps.map((s) => (
        <Inner key={s.id} id={`step-${s.id}`} className="scroll-mt-24 p-4 sm:p-5">
          <div className="flex gap-3.5">
            <StepNumber n={s.order} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <h3 className="min-w-0 basis-full text-[15px] font-medium tracking-tight sm:basis-auto sm:flex-1">{s.title}</h3>
                <OwnerBadge owner={s.owner} />
                {s.estMinutes !== null && <span className="font-mono text-[11px] text-subtle-foreground">~{s.estMinutes} min</span>}
                <EvidenceBadge evidence={s.evidence} sourceIds={s.sourceIds} />
              </div>
              <Prose className="mt-1.5">{s.body}</Prose>
              {s.url && <CopyRow value={s.url} />}
              {s.agentCanHelp && (
                <p className="mt-3 flex gap-2 text-[13px] text-muted-foreground">
                  <Robot size={15} weight="duotone" className="mt-0.5 shrink-0 text-own-agent" />
                  <span>
                    <span className="font-medium text-foreground">An agent can help: </span>
                    {s.agentCanHelp}
                  </span>
                </p>
              )}
              {blockersByStep.get(s.id)?.map((b) => (
                <a key={b.id} href={`#blocker-${b.id}`} className="mt-2 flex w-fit items-center gap-1.5 text-[13px] text-destructive hover:underline">
                  <Warning size={14} weight="duotone" /> Watch out: {b.title}
                </a>
              ))}
            </div>
          </div>
        </Inner>
      ))}
    </Tray>
  );
}

const TIER = {
  basic: "bg-ev-tested/12 text-ev-tested",
  sensitive: "bg-diff-moderate/15 text-diff-moderate",
  restricted: "bg-diff-gated/15 text-diff-gated",
  unknown: "bg-muted text-subtle-foreground",
} as const;

const REVIEW = {
  yes: { label: "Needs review", cls: "text-diff-hard", icon: Warning },
  no: { label: "No review", cls: "text-ev-tested", icon: Check },
  unknown: { label: "Unknown", cls: "text-subtle-foreground", icon: Question },
} as const;

/** Aligned rows instead of a table: scope + tier, note underneath, review status, evidence in a fixed column. */
export function ScopesTable({ guide }: { guide: Guide }) {
  return (
    <Tray>
      <Inner>
        <div className="hidden grid-cols-[minmax(0,1fr)_120px_132px] gap-4 border-b px-4 py-2.5 text-xs text-muted-foreground md:grid">
          <span>Permission</span>
          <span>Review</span>
          <span className="text-right">How we know</span>
        </div>
        <ul className="divide-y">
          {guide.scopes.map((sc) => {
            const r = REVIEW[sc.triggersReview === null ? "unknown" : sc.triggersReview ? "yes" : "no"];
            return (
              <li key={sc.name} className="grid grid-cols-1 gap-2 px-4 py-3.5 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(0,1fr)_120px_132px] md:items-start md:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12.5px] break-all">{sc.name}</code>
                    <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium capitalize", TIER[sc.tier])}>{sc.tier}</span>
                  </div>
                  {sc.note && <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{sc.note}</p>}
                </div>
                <div className="flex items-center justify-between gap-3 md:contents">
                  <span className={cn("flex items-center gap-1.5 text-[13px] md:pt-1", r.cls)}>
                    <r.icon size={14} weight="bold" />
                    {r.label}
                  </span>
                  <span className="flex md:justify-end md:pt-0.5">
                    <EvidenceBadge evidence={sc.evidence} sourceIds={sc.sourceIds} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </Inner>
    </Tray>
  );
}

export function Nuances({ guide }: { guide: Guide }) {
  if (!guide.nuances.length) return <Tray><Inner><Empty>No nuances recorded.</Empty></Inner></Tray>;
  return (
    <BouncyAccordion
      defaultValue={guide.nuances[0]?.id ?? null}
      items={guide.nuances.map((n) => ({
        id: n.id,
        title: n.title,
        description: (
          <span className="block">
            <Prose>{n.body}</Prose>
            <span className="mt-2.5 block">
              <EvidenceBadge evidence={n.evidence} sourceIds={n.sourceIds} />
            </span>
          </span>
        ),
      }))}
    />
  );
}

const SEVERITY = {
  low: { label: "Low", cls: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", cls: "bg-diff-moderate/15 text-diff-moderate" },
  high: { label: "High", cls: "bg-destructive/15 text-destructive" },
} as const;

export function Blockers({ guide }: { guide: Guide }) {
  if (!guide.blockers.length) return <Tray><Inner><Empty>No known blockers. That doesn’t mean there aren’t any.</Empty></Inner></Tray>;
  const stepTitle = new Map(guide.steps.map((s) => [s.id, s.title]));
  return (
    <Tray>
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {guide.blockers.map((b) => (
          <Inner key={b.id} id={`blocker-${b.id}`} className="flex scroll-mt-24 flex-col p-4">
            <div className="flex items-start gap-2">
              <Warning size={16} weight="duotone" className="mt-0.5 shrink-0 text-destructive" />
              <h3 className="flex-1 text-sm font-medium">{b.title}</h3>
              <span className={cn("rounded-md px-1.5 py-px text-[10.5px] font-medium", SEVERITY[b.severity].cls)}>{SEVERITY[b.severity].label}</span>
            </div>
            <p className="mt-2.5 text-[13px] text-muted-foreground">{b.symptom}</p>
            <div className="mt-3 rounded-lg bg-muted/50 p-3 ring-1 ring-border">
              <p className="text-[11px] font-medium text-ev-tested">Fix</p>
              <Prose className="mt-0.5 text-[13px] text-foreground">{b.fix}</Prose>
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              {b.stepId && stepTitle.has(b.stepId) ? (
                <a href={`#step-${b.stepId}`} className="truncate text-xs text-subtle-foreground hover:text-foreground hover:underline">
                  Affects: {stepTitle.get(b.stepId)}
                </a>
              ) : (
                <span />
              )}
              <EvidenceBadge evidence={b.evidence} sourceIds={b.sourceIds} />
            </div>
          </Inner>
        ))}
      </div>
    </Tray>
  );
}

export function OwnershipMatrix({ guide }: { guide: Guide }) {
  const cols = [
    { title: "An agent can do", icon: <Robot size={16} weight="duotone" className="text-own-agent" />, items: guide.ownership.agentCan },
    { title: "You must do", icon: <User size={16} weight="duotone" className="text-own-human" />, items: guide.ownership.humanMust },
  ];
  return (
    <Tray>
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {cols.map((c) => (
          <Inner key={c.title} className="p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              {c.icon}
              {c.title}
            </h3>
            {c.items.length ? (
              <ul className="mt-3 space-y-2">
                {c.items.map((t) => (
                  <li key={t} className="flex gap-2.5 text-[13px] text-muted-foreground">
                    <Check size={14} weight="bold" className="mt-0.5 shrink-0 text-subtle-foreground" />
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-subtle-foreground">Nothing identified.</p>
            )}
          </Inner>
        ))}
      </div>
    </Tray>
  );
}

export function Unknowns({ guide }: { guide: Guide }) {
  return (
    <Tray>
      <Inner className="divide-y">
        {guide.unknowns.length ? (
          guide.unknowns.map((u, i) => (
            <p key={u} className="flex gap-3 px-4 py-3 text-[13px] text-muted-foreground">
              <span className="font-mono text-[11px] text-subtle-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              {u}
            </p>
          ))
        ) : (
          <Empty>Every claim in this guide is backed by a source. Policies still change: check the dates.</Empty>
        )}
      </Inner>
    </Tray>
  );
}

const SOURCE_KIND = { official_docs: "Official docs", console: "Console", policy: "Policy", community: "Community", other: "Other" } as const;

export function SourceList({ guide }: { guide: Guide }) {
  if (!guide.sources.length) return <Tray><Inner><Empty>No sources. Treat every claim above as unconfirmed.</Empty></Inner></Tray>;
  return (
    <Tray>
      <Inner className="divide-y">
        {guide.sources.map((s) => (
          <a
            key={s.id}
            id={`source-${s.id}`}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group flex scroll-mt-24 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 target:bg-brand/[0.06]"
          >
            <span className="w-5 shrink-0 font-mono text-[11px] text-subtle-foreground tabular-nums">{s.id.slice(1)}</span>
            <AppLogo name={domainOf(s.url)} website={s.url} size={24} className="rounded-md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium group-hover:underline">{s.title}</span>
              <span className="block truncate font-mono text-[11px] text-subtle-foreground">{domainOf(s.url)}</span>
            </span>
            <span className={cn("hidden rounded-md px-1.5 py-px text-[10.5px] font-medium sm:inline", s.kind === "community" || s.kind === "other" ? "bg-ev-community/12 text-ev-community" : "bg-ev-documented/12 text-ev-documented")}>
              {SOURCE_KIND[s.kind]}
            </span>
            {s.fetchedAt && <span className="hidden font-mono text-[11px] text-subtle-foreground md:inline">{formatDate(s.fetchedAt)}</span>}
            <ArrowUpRight size={14} className="text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        ))}
      </Inner>
    </Tray>
  );
}
