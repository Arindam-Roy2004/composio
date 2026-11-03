import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AtAGlance } from "@/components/guide/at-a-glance";
import { CopyPageButton } from "@/components/guide/guide-actions";
import { GuideSidebar, GuideSwitcherMobile } from "@/components/guide/guide-sidebar";
import { GuideBreadcrumb } from "@/components/guide/guide-breadcrumb";
import { GuideView } from "@/components/guide/guide-view";
import { Pager } from "@/components/guide/pager";
import { RoadmapLazy } from "@/components/guide/roadmap-lazy";
import { Blockers, Nuances, OwnershipMatrix, Prerequisites, ScopesTable, Section, SourceList, StepList, Unknowns } from "@/components/guide/sections";
import { SourcesProvider } from "@/components/guide/sources-context";
import { Toc } from "@/components/guide/toc";
import { InShort } from "@/components/guide/in-short";
import type { Guide } from "@/lib/schema/guide.schema";
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

type SectionDef = { id: string; nav: string; title: string; description: string; show: (g: Guide) => boolean; render: (g: Guide) => React.ReactNode };

/** Every section in reading order. Empty sections are skipped instead of showing "nothing found" boxes. */
const SECTIONS: SectionDef[] = [
  {
    id: "roadmap",
    nav: "Roadmap",
    title: "Roadmap",
    description: "Every step in order, grouped by who does it. Click a step to read it.",
    show: (g) => g.steps.length > 1,
    render: (g) => (
      <div className="rounded-2xl bg-muted/40 p-1.5 ring-1 ring-border">
        <div className="rounded-xl bg-background p-3 ring-1 ring-border">
          <RoadmapLazy guide={g} />
        </div>
      </div>
    ),
  },
  { id: "prerequisites", nav: "Before you start", title: "Before you start", description: "Get these ready first so you don’t get stuck halfway.", show: (g) => g.prerequisites.length > 0, render: (g) => <Prerequisites guide={g} /> },
  { id: "steps", nav: "Steps", title: "Steps", description: "Follow these in order. Each step says who does it and how we know it’s right.", show: (g) => g.steps.length > 0, render: (g) => <StepList guide={g} /> },
  { id: "scopes", nav: "Permissions", title: "Permissions (scopes)", description: "What your app asks users for. Ask for as few as you can, because some trigger a review.", show: (g) => g.scopes.length > 0, render: (g) => <ScopesTable guide={g} /> },
  { id: "nuances", nav: "Good to know", title: "Good to know", description: "Small rules that are easy to miss and often cause problems later.", show: (g) => g.nuances.length > 0, render: (g) => <Nuances guide={g} /> },
  { id: "blockers", nav: "Blockers", title: "If you get stuck", description: "Problems developers commonly hit, and how to get past them.", show: (g) => g.blockers.length > 0, render: (g) => <Blockers guide={g} /> },
  {
    id: "ownership",
    nav: "Agent vs you",
    title: "What an agent can do for you",
    description: "The work you can hand to an AI agent, and the parts only you can do.",
    show: (g) => g.ownership.agentCan.length + g.ownership.humanMust.length > 0,
    render: (g) => <OwnershipMatrix guide={g} />,
  },
  { id: "unknowns", nav: "Unconfirmed", title: "What we couldn’t confirm", description: "Things we couldn’t check. Confirm these before you rely on them.", show: (g) => g.unknowns.length > 0, render: (g) => <Unknowns guide={g} /> },
  { id: "sources", nav: "Sources", title: "Sources", description: "Where every fact on this page comes from.", show: (g) => g.sources.length > 0, render: (g) => <SourceList guide={g} /> },
];

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
  // With no sources there is nothing to explain beyond the summary and the open questions.
  const sections = SECTIONS.filter((sec) => sec.show(guide) && (guide.sources.length > 0 || sec.id === "unknowns"));
  const toc = [["overview", "Overview"] as const, ...sections.map((sec) => [sec.id, sec.nav] as const)];

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
                    {[domainOf(guide.website), guide.category, OAUTH_LABEL[guide.oauthSupport]].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground text-balance">{guide.verdict.oneLiner}</p>
            </header>
          </Reveal>

          <GuideView markdown={guideToMarkdown(guide)} actions={<CopyPageButton key="copy-page" guide={guide} />}>
            <div key="guide-body" className="mt-6 space-y-14">
              <section key="overview" id="overview" className="scroll-mt-24 space-y-3" aria-label="Overview">
                <InShort guide={guide} />
                {guide.sources.length > 0 && <AtAGlance guide={guide} />}
              </section>
              {sections.map((sec) => (
                <Section key={sec.id} id={sec.id} title={sec.title} description={sec.description}>
                  {sec.render(guide)}
                </Section>
              ))}
              <Pager key="pager" prev={prev} next={next && next.slug !== guide.slug ? next : undefined} />
            </div>
          </GuideView>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-8">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">On this page</p>
              <Toc items={toc} />
            </div>
            <EvidenceLegend compact />
          </div>
        </aside>
      </div>
    </SourcesProvider>
  );
}
