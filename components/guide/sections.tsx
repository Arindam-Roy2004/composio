"use client";

import { ArrowUpRight, Bot, CircleHelp, ExternalLink, Sparkles, TriangleAlert, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { EvidenceBadge } from "@/components/guide/evidence-badge";
import { OwnerBadge } from "@/components/guide/owner-badge";
import { Prose } from "@/components/guide/prose";
import { AppLogo } from "@/components/site/app-logo";
import { domainOf, formatDate } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

export function Section({ id, title, kicker, children, className }: { id: string; title: string; kicker?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-20", className)}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {kicker && <span className="text-xs text-subtle-foreground">{kicker}</span>}
      </div>
      {children}
    </section>
  );
}

const KIND_LABEL = { account: "Account", domain: "Domain", legal: "Legal", business: "Business", payment: "Payment", technical: "Technical", other: "Other" } as const;

export function Prerequisites({ guide }: { guide: Guide }) {
  const key = `prereq:${guide.slug}`;
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* storage unavailable: checklist still works for this visit */
    }
  }, [key]);
  const toggle = (id: string, value: boolean) => {
    setDone((prev) => {
      const next = { ...prev, [id]: value };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  if (!guide.prerequisites.length) return <EmptyNote>No prerequisites found beyond an account.</EmptyNote>;
  const count = guide.prerequisites.filter((p) => done[p.id]).length;
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs text-muted-foreground">
        <span>Have these ready before you start</span>
        <span className="font-mono tabular-nums">
          {count}/{guide.prerequisites.length}
        </span>
      </div>
      <ul className="divide-y">
        {guide.prerequisites.map((p) => (
          <li key={p.id} className="flex gap-3 px-4 py-3">
            <Checkbox id={`pre-${p.id}`} checked={Boolean(done[p.id])} onCheckedChange={(v) => toggle(p.id, v === true)} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor={`pre-${p.id}`} className={cn("cursor-pointer text-sm font-medium", done[p.id] && "text-muted-foreground line-through")}>
                  {p.label}
                </label>
                <span className="rounded border px-1 font-mono text-[10px] text-subtle-foreground uppercase">{KIND_LABEL[p.kind]}</span>
                <EvidenceBadge evidence={p.evidence} sourceIds={p.sourceIds} className="ml-auto" />
              </div>
              <Prose className="mt-1">{p.detail}</Prose>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StepList({ guide }: { guide: Guide }) {
  const blockersByStep = new Map<string, Guide["blockers"]>();
  for (const b of guide.blockers) if (b.stepId) blockersByStep.set(b.stepId, [...(blockersByStep.get(b.stepId) ?? []), b]);
  return (
    <ol className="space-y-3">
      {[...guide.steps]
        .sort((a, b) => a.order - b.order)
        .map((s) => (
          <li key={s.id} id={`step-${s.id}`} className="scroll-mt-20 rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full border font-mono text-[11px] text-muted-foreground">{s.order}</span>
              <h3 className="min-w-0 flex-1 text-[15px] font-medium tracking-tight">{s.title}</h3>
              <OwnerBadge owner={s.owner} />
              {s.estMinutes !== null && <span className="font-mono text-[11px] text-subtle-foreground">~{s.estMinutes} min</span>}
              <EvidenceBadge evidence={s.evidence} sourceIds={s.sourceIds} />
            </div>
            <Prose className="mt-2 sm:pl-8">{s.body}</Prose>
            <div className="sm:pl-8">
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex max-w-full items-center gap-1 font-mono text-xs text-brand hover:underline">
                  <span className="truncate">{s.url.replace(/^https:\/\//, "")}</span>
                  <ArrowUpRight className="size-3 shrink-0" strokeWidth={1.75} />
                </a>
              )}
              {s.agentCanHelp && (
                <div className="mt-3 flex gap-2 rounded-lg border border-own-agent/25 bg-own-agent/5 px-3 py-2 text-xs">
                  <Bot className="mt-px size-3.5 shrink-0 text-own-agent" strokeWidth={1.75} />
                  <span>
                    <span className="font-medium text-own-agent">An agent can help: </span>
                    <span className="text-muted-foreground">{s.agentCanHelp}</span>
                  </span>
                </div>
              )}
              {blockersByStep.get(s.id)?.map((b) => (
                <a key={b.id} href={`#blocker-${b.id}`} className="mt-2 flex items-center gap-1.5 text-xs text-destructive hover:underline">
                  <TriangleAlert className="size-3.5" strokeWidth={1.75} /> Known blocker: {b.title}
                </a>
              ))}
            </div>
          </li>
        ))}
    </ol>
  );
}

const TIER = {
  basic: "text-ev-tested border-ev-tested/35",
  sensitive: "text-diff-moderate border-diff-moderate/40",
  restricted: "text-diff-gated border-diff-gated/40",
  unknown: "text-subtle-foreground border-dashed",
} as const;

export function ScopesTable({ guide }: { guide: Guide }) {
  if (!guide.scopes.length) return <EmptyNote>No scope information found.</EmptyNote>;
  return (
    <div className="relative overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Scope</th>
            <th className="px-2 py-2.5 font-medium">Tier</th>
            <th className="px-2 py-2.5 font-medium">Triggers review</th>
            <th className="px-2 py-2.5 font-medium">Note</th>
            <th className="px-4 py-2.5 font-medium"><span className="sr-only">Evidence</span></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {guide.scopes.map((s) => (
            <tr key={s.name} className="align-top">
              <td className="px-4 py-3 font-mono text-xs break-all">{s.name}</td>
              <td className="px-2 py-3">
                <span className={cn("inline-flex h-5 items-center rounded-full border px-1.5 text-[11px] capitalize", TIER[s.tier])}>{s.tier}</span>
              </td>
              <td className="px-2 py-3 text-xs">{s.triggersReview === null ? <span className="text-subtle-foreground">Unknown</span> : s.triggersReview ? "Yes" : "No"}</td>
              <td className="px-2 py-3 text-xs text-muted-foreground">{s.note}</td>
              <td className="px-4 py-3 text-right">
                <EvidenceBadge evidence={s.evidence} sourceIds={s.sourceIds} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Nuances({ guide }: { guide: Guide }) {
  if (!guide.nuances.length) return <EmptyNote>No nuances recorded.</EmptyNote>;
  return (
    <Accordion type="multiple" className="rounded-xl border bg-card px-4">
      {guide.nuances.map((n) => (
        <AccordionItem key={n.id} value={n.id}>
          <AccordionTrigger className="gap-3 text-sm hover:no-underline">
            <span className="flex flex-1 flex-wrap items-center gap-2 text-left">
              {n.title}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Prose>{n.body}</Prose>
            <div className="mt-2">
              <EvidenceBadge evidence={n.evidence} sourceIds={n.sourceIds} />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const SEVERITY = { low: "bg-muted-foreground", medium: "bg-diff-moderate", high: "bg-destructive" } as const;

export function Blockers({ guide }: { guide: Guide }) {
  if (!guide.blockers.length) return <EmptyNote>No known blockers. That doesn’t mean there aren’t any.</EmptyNote>;
  const stepTitle = new Map(guide.steps.map((s) => [s.id, s.title]));
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {guide.blockers.map((b) => (
        <article key={b.id} id={`blocker-${b.id}`} className="scroll-mt-20 rounded-xl border bg-card p-4">
          <div className="flex items-start gap-2">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", SEVERITY[b.severity])} aria-label={`${b.severity} severity`} />
            <h3 className="flex-1 text-sm font-medium">{b.title}</h3>
            <EvidenceBadge evidence={b.evidence} sourceIds={b.sourceIds} />
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="font-medium text-subtle-foreground uppercase">Symptom</dt>
              <dd className="mt-0.5 text-muted-foreground">{b.symptom}</dd>
            </div>
            <div>
              <dt className="font-medium text-subtle-foreground uppercase">Fix</dt>
              <dd className="mt-0.5">
                <Prose className="text-xs text-foreground">{b.fix}</Prose>
              </dd>
            </div>
          </dl>
          {b.stepId && stepTitle.has(b.stepId) && (
            <a href={`#step-${b.stepId}`} className="mt-3 inline-block text-xs text-subtle-foreground hover:text-foreground hover:underline">
              Affects: {stepTitle.get(b.stepId)}
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

export function OwnershipMatrix({ guide }: { guide: Guide }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-own-agent/25 bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-own-agent">
          <Bot className="size-4" strokeWidth={1.5} /> An agent can do
        </h3>
        <List items={guide.ownership.agentCan} empty="Nothing identified." />
      </div>
      <div className="rounded-xl border border-own-human/25 bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-own-human">
          <User className="size-4" strokeWidth={1.5} /> You must do
        </h3>
        <List items={guide.ownership.humanMust} empty="Nothing identified." />
      </div>
    </div>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="mt-3 text-sm text-subtle-foreground">{empty}</p>;
  return (
    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  );
}

export function Unknowns({ guide }: { guide: Guide }) {
  return (
    <div className="rounded-xl border border-dashed border-ev-uncertain/50 bg-ev-uncertain/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-ev-uncertain">
        <CircleHelp className="size-4" strokeWidth={1.5} /> What we couldn’t confirm
      </div>
      {guide.unknowns.length ? (
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {guide.unknowns.map((u) => (
            <li key={u} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-ev-uncertain" aria-hidden />
              {u}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Every claim in this guide is backed by a source. Policies still change: check the dates.</p>
      )}
    </div>
  );
}

const SOURCE_KIND = { official_docs: "Official docs", console: "Console", policy: "Policy", community: "Community", other: "Other" } as const;

export function SourceList({ guide }: { guide: Guide }) {
  if (!guide.sources.length) return <EmptyNote>No sources. Treat every claim above as unconfirmed.</EmptyNote>;
  return (
    <ol className="divide-y rounded-xl border bg-card">
      {guide.sources.map((s) => (
        <li key={s.id} id={`source-${s.id}`} className="flex scroll-mt-20 items-center gap-3 px-4 py-3 target:bg-brand/5">
          <span className="w-6 shrink-0 font-mono text-xs text-subtle-foreground">{s.id.slice(1)}</span>
          <AppLogo name={domainOf(s.url)} website={s.url} size={22} className="rounded-md" />
          <div className="min-w-0 flex-1">
            <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-sm font-medium hover:underline">
              <span className="truncate">{s.title}</span>
              <ExternalLink className="size-3 shrink-0 text-subtle-foreground" strokeWidth={1.75} />
            </a>
            <p className="truncate font-mono text-[11px] text-subtle-foreground">{domainOf(s.url)}</p>
          </div>
          <span className={cn("hidden rounded-full border px-1.5 py-px text-[11px] sm:inline", s.kind === "community" || s.kind === "other" ? "text-ev-community" : "text-ev-documented")}>
            {SOURCE_KIND[s.kind]}
          </span>
          {s.fetchedAt && <span className="hidden font-mono text-[11px] text-subtle-foreground md:inline">{formatDate(s.fetchedAt)}</span>}
        </li>
      ))}
    </ol>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-subtle-foreground">
      <Sparkles className="size-3.5" strokeWidth={1.5} />
      {children}
    </p>
  );
}
