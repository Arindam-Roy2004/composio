import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoadmapLazy } from "@/components/guide/roadmap-lazy";
import { RoadmapLegend } from "@/components/guide/roadmap";
import { Blockers, Nuances, OwnershipMatrix, Prerequisites, ScopesTable, Section, SourceList, StepList, Unknowns } from "@/components/guide/sections";
import { SourcesProvider } from "@/components/guide/sources-context";
import { SummaryHero } from "@/components/guide/summary-hero";
import { Toc } from "@/components/guide/toc";
import { EvidenceLegend } from "@/components/home/evidence-legend";
import { Reveal } from "@/components/site/reveal";
import { GuideParamsDto } from "@/lib/dto/guide-params.dto";
import { DIFFICULTY_META, formatApproval, formatMinutes } from "@/lib/format";
import { getGuide } from "@/lib/storage/guides";

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

export default async function GuidePage({ params }: Props) {
  const guide = await load(params);
  if (!guide) notFound();

  return (
    <SourcesProvider sources={guide.sources}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-[480px] overflow-hidden" aria-hidden>
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
          <div className="absolute -top-24 left-[8%] h-80 w-[640px] max-w-full rounded-full bg-[radial-gradient(closest-side,var(--brand-glow),transparent)] blur-2xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
          <Reveal>
            <SummaryHero guide={guide} />
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_180px]">
            <div className="min-w-0 space-y-16">
              <Reveal index={1}>
                <Section id="roadmap" index={1} title="Roadmap" kicker={`${guide.steps.length} steps · click a step for details`}>
                  <RoadmapLazy guide={guide} />
                  <div className="mt-3">
                    <RoadmapLegend />
                  </div>
                </Section>
              </Reveal>
              <Reveal index={2}>
                <Section id="prerequisites" index={2} title="Before you start">
                  <Prerequisites guide={guide} />
                </Section>
              </Reveal>
              <Section id="steps" index={3} title="Steps">
                <StepList guide={guide} />
              </Section>
              <Section id="scopes" index={4} title="Scopes" kicker="Request the minimum you need">
                <ScopesTable guide={guide} />
              </Section>
              <Section id="nuances" index={5} title="Nuances">
                <Nuances guide={guide} />
              </Section>
              <Section id="blockers" index={6} title="Blockers" kicker="Symptom → fix">
                <Blockers guide={guide} />
              </Section>
              <Section id="ownership" index={7} title="What an agent can do vs where you take over">
                <OwnershipMatrix guide={guide} />
              </Section>
              <Section id="unknowns" index={8} title="What we couldn’t confirm">
                <Unknowns guide={guide} />
              </Section>
              <Section id="sources" index={9} title="Sources" kicker={`${guide.sources.length} cited`}>
                <SourceList guide={guide} />
              </Section>
            </div>

            <aside className="hidden lg:block">
              <nav aria-label="On this page" className="sticky top-24 space-y-8">
                <Toc items={TOC} />
                <EvidenceLegend compact />
              </nav>
            </aside>
          </div>
        </div>
      </div>
    </SourcesProvider>
  );
}
