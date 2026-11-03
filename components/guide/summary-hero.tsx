"use client";

import { Check, Clock3, Copy, FileDown, Hourglass, Link2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AppLogo } from "@/components/site/app-logo";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/guide/count-up";
import { DifficultyMeter } from "@/components/guide/difficulty-meter";
import { EvidenceBadge } from "@/components/guide/evidence-badge";
import { APPROVAL_LABEL, DIFFICULTY_META, domainOf, formatApproval, formatDate, formatMinutes } from "@/lib/format";
import { guideToMarkdown } from "@/lib/guide/markdown";
import type { Guide } from "@/lib/schema/guide.schema";

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error("Couldn't access the clipboard");
  }
}

const OAUTH_LABEL: Record<Guide["oauthSupport"], string> = {
  oauth2: "OAuth 2.0",
  oauth2_pkce: "OAuth 2.0 + PKCE",
  oauth1: "OAuth 1.0a",
  api_key_only: "API keys only",
  none: "No public API auth",
  unknown: "Auth model unknown",
};

export function SummaryHero({ guide }: { guide: Guide }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const isLibrary = guide.generatedBy === "library";

  return (
    <section aria-labelledby="guide-title" className="relative">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <AppLogo name={guide.appName} website={guide.website} size={44} />
            <div className="min-w-0">
              <h1 id="guide-title" className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {guide.appName}
              </h1>
              <p className="font-mono text-xs text-subtle-foreground">
                {domainOf(guide.website)} · {guide.category} · {OAUTH_LABEL[guide.oauthSupport]}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <DifficultyMeter difficulty={guide.verdict.difficulty} />
            <EvidenceBadge evidence={guide.verdict.evidence} sourceIds={guide.verdict.sourceIds} />
          </div>
          <p className="mt-3 max-w-2xl text-lg leading-snug text-balance">{guide.verdict.oneLiner}</p>
          <p className="mt-1 text-xs text-subtle-foreground">{DIFFICULTY_META[guide.verdict.difficulty].description}</p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await copy(window.location.href, "Link");
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check strokeWidth={1.5} /> : <Link2 strokeWidth={1.5} />} Copy link
          </Button>
          <Button variant="outline" size="sm" onClick={() => copy(guideToMarkdown(guide, window.location.origin), "Markdown")}>
            <FileDown strokeWidth={1.5} /> Copy as Markdown
          </Button>
          {!isLibrary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/?q=${encodeURIComponent(guide.appName)}&refresh=1#generate`)}
              title="Re-run the research agent (rate-limited)"
            >
              <RefreshCw strokeWidth={1.5} /> Regenerate
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <StatTile
          icon={<Clock3 className="size-4" strokeWidth={1.5} />}
          label="Active work"
          value={formatMinutes(guide.time.activeSetup.minMinutes, guide.time.activeSetup.maxMinutes)}
          hint="Hands-on time: forms, config, code"
          claim={guide.time.activeSetup}
        />
        <StatTile
          icon={<Hourglass className="size-4" strokeWidth={1.5} />}
          label="Approval wait"
          value={formatApproval(guide.time.approvalWait)}
          hint={`${APPROVAL_LABEL[guide.time.approvalWait.required]}. ${guide.time.approvalWait.note}`}
          claim={guide.time.approvalWait}
        />
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle-foreground">
        {isLibrary ? (
          <span>
            Library guide · researched {formatDate(guide.generatedAt)}
            {guide.lastVerifiedAt ? ` · last verified ${formatDate(guide.lastVerifiedAt)}` : " · not yet hands-on verified"}
          </span>
        ) : (
          <span>
            AI-generated on {formatDate(guide.generatedAt)}
            {guide.agentRun && ` · ${guide.agentRun.toolCalls} tool calls, ${guide.agentRun.pagesRead} pages read, ${Math.round(guide.agentRun.durationMs / 1000)}s`}
            {guide.agentRun?.downgrades ? ` · ${guide.agentRun.downgrades} claims downgraded by verification` : ""}
          </span>
        )}
        <button type="button" className="inline-flex items-center gap-1 underline-offset-2 hover:underline" onClick={() => copy(guide.slug, "Slug")}>
          <Copy className="size-3" strokeWidth={1.5} />
          <span className="font-mono">{guide.slug}</span>
        </button>
      </p>
    </section>
  );
}

function StatTile(props: { icon: React.ReactNode; label: string; value: string; hint: string; claim: { evidence: Guide["verdict"]["evidence"]; sourceIds: string[] } }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {props.icon}
          {props.label}
        </span>
        <EvidenceBadge evidence={props.claim.evidence} sourceIds={props.claim.sourceIds} />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">
        <CountUp text={props.value} />
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{props.hint}</p>
    </div>
  );
}
