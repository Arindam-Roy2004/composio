import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AtAGlance } from "@/components/guide/at-a-glance";
import { CopyPageButton } from "@/components/guide/guide-actions";
import { GuideSidebar, GuideSwitcherMobile } from "@/components/guide/guide-sidebar";
import { GuideBreadcrumb } from "@/components/guide/guide-breadcrumb";
import { GuideView } from "@/components/guide/guide-view";
import { Pager } from "@/components/guide/pager";
import { RoadmapLegend } from "@/components/guide/roadmap";
import { RoadmapLazy } from "@/components/guide/roadmap-lazy";
import { Blockers, Nuances, OwnershipMatrix, Prerequisites, ScopesTable, Section, SourceList, StepList, Unknowns } from "@/components/guide/sections";
import { SourcesProvider } from "@/components/guide/sources-context";
import { Toc } from "@/components/guide/toc";
import { EvidenceLegend } from "@/components/home/evidence-legend";
import { AppLogo } from "@/components/site/app-logo";
import { Reveal } from "@/components/site/reveal";
import { GuideParamsDto } from "@/lib/dto/guide-params.dto";
import { DIFFICULTY_META, domainOf, formatApproval, formatMinutes } from "@/lib/format";
import { guideToMarkdown } from "@/lib/guide/markdown";
import { getGuide, listGuides } from "@/lib/storage/guides";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(params: Props["params"]) {
  const r = GuideParamsDto.validate(await params);
  if (r.errors) return null;
  return getGuide(r.value.slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = await load(params);
  if (!guide) return { title: "Guide not found" };
  const title = `${guide.appName} OAuth app setup`;
  const description = `${DIFFICULTY_META[guide.verdict.difficulty].label}. Active work ${formatMinutes(guide.time.activeSetup.minMinutes, guide.time.activeSetup.maxMinutes)}, approval ${formatApproval(guide.time.approvalWait).toLowerCase()}. ${guide.verdict.oneLiner}`;
  return { title, description, openGraph: { title, description, type: "article" }, twitter: { card: "summary_large_image", title, description } };
}

const TOC = [
  ["overview", "Overview"],
  ["roadmap", "Roadmap"],
  ["prerequisites", "Before you start"],
  ["steps", "Steps"],
  ["scopes", "Scopes"],
  ["nuances", "Nuances"],
  ["blockers", "Blockers"],
  ["ownership", "Agent vs you"],
  ["unknowns", "Unconfirmed"],
  ["sources", "Sources"],
] as const;

const OAUTH_LABEL = {
  oauth2: "OAuth 2.0",
  oauth2_pkce: "OAuth 2.0 + PKCE",
  oauth1: "OAuth 1.0a",
  api_key_only: "API keys only",
  none: "No public API auth",
  unknown: "Auth model unknown",
} as const;

export default async function GuidePage({ params }: Props) {
  const guide = await load(params);
  if (!guide) notFound();
  const lists = await listGuides().catch(() => ({ library: [], generated: [] }));
  const order = lists.library;
  const idx = order.findIndex((g) => g.slug === guide.slug);
  const prev = idx > 0 ? order[idx - 1] : undefined;
  const next = idx >= 0 ? order[idx + 1] : order[0];

  return (
    <SourcesProvider sources={guide.sources}>
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 pt-6 pb-20 sm:px-6 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)_200px]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <GuideSidebar library={lists.library} generated={lists.generated} />
          </div>
        </aside>

        <article className="min-w-0 max-w-[860px]">
          <GuideSwitcherMobile library={lists.library} current={guide.slug} />
          <Reveal>
            <GuideBreadcrumb appName={guide.appName} />

            <header className="mt-6">
              <div className="flex items-center gap-3.5">
                <AppLogo name={guide.appName} website={guide.website} size={48} className="rounded-xl shadow-card" />
                <div className="min-w-0">
                  <h1 className="truncate text-[32px] leading-tight font-semibold tracking-[-0.035em] sm:text-[38px]">{guide.appName}</h1>
                  <p className="truncate font-mono text-xs text-subtle-foreground">
                    {domainOf(guide.website)} · {guide.category} · {OAUTH_LABEL[guide.oauthSupport]}
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground text-balance">{guide.verdict.oneLiner}</p>
            </header>
          </Reveal>

          <GuideView markdown={guideToMarkdown(guide)} actions={<CopyPageButton key="copy-page" guide={guide} />}>
            <div key="guide-body" className="mt-6 space-y-16">
              <section key="overview" id="overview" className="scroll-mt-24" aria-label="Overview">
                <AtAGlance guide={guide} />
              </section>
              <Section key="roadmap" id="roadmap" title="Roadmap" description="Each step, coloured by who does it. Click a step to jump to its details.">
                <div className="rounded-2xl bg-muted/40 p-1.5 ring-1 ring-border">
                  <RoadmapLazy guide={guide} />
                  <div className="px-2 pt-2.5 pb-1">
                    <RoadmapLegend />
                  </div>
                </div>
              </Section>
              <Section key="prerequisites" id="prerequisites" title="Before you start" description="What you need in hand before you open the console.">
                <Prerequisites guide={guide} />
              </Section>
              <Section key="steps" id="steps" title="Steps" description="The full path from registration to production.">
                <StepList guide={guide} />
              </Section>
              <Section key="scopes" id="scopes" title="Scopes" description="Which permissions exist and which of them trigger a review.">
                <ScopesTable guide={guide} />
              </Section>
              <Section key="nuances" id="nuances" title="Nuances" description="Rules that are easy to miss until they break something.">
                <Nuances guide={guide} />
              </Section>
              <Section key="blockers" id="blockers" title="Blockers" description="Symptoms you might hit, and how to get past them.">
                <Blockers guide={guide} />
              </Section>
              <Section key="ownership" id="ownership" title="Agent vs you" description="What an AI agent can do for you, and where you have to take over.">
                <OwnershipMatrix guide={guide} />
              </Section>
              <Section key="unknowns" id="unknowns" title="What we couldn’t confirm" description="Stated openly rather than guessed.">
                <Unknowns guide={guide} />
              </Section>
              <Section key="sources" id="sources" title="Sources">
                <SourceList guide={guide} />
              </Section>
              <Pager key="pager" prev={prev} next={next && next.slug !== guide.slug ? next : undefined} />
            </div>
          </GuideView>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-8">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">On this page</p>
              <Toc items={TOC} />
            </div>
            <EvidenceLegend compact />
          </div>
        </aside>
      </div>
    </SourcesProvider>
  );
}
