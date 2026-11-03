import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoadmapLazy } from "@/components/guide/roadmap-lazy";
import { RoadmapLegend } from "@/components/guide/roadmap";
import { Blockers, Nuances, OwnershipMatrix, Prerequisites, ScopesTable, Section, SourceList, StepList, Unknowns } from "@/components/guide/sections";
import { SourcesProvider } from "@/components/guide/sources-context";
import { SummaryHero } from "@/components/guide/summary-hero";
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
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
          <Reveal>
            <SummaryHero guide={guide} />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_180px]">
            <div className="min-w-0 space-y-12">
              <Reveal index={1}>
                <Section id="roadmap" title="Roadmap" kicker={`${guide.steps.length} steps · click a step for details`}>
                  <RoadmapLazy guide={guide} />
                  <div className="mt-3">
                    <RoadmapLegend />
                  </div>
                </Section>
              </Reveal>
              <Reveal index={2}>
                <Section id="prerequisites" title="Before you start">
                  <Prerequisites guide={guide} />
                </Section>
              </Reveal>
              <Section id="steps" title="Steps">
                <StepList guide={guide} />
              </Section>
              <Section id="scopes" title="Scopes" kicker="Request the minimum you need">
                <ScopesTable guide={guide} />
              </Section>
              <Section id="nuances" title="Nuances">
                <Nuances guide={guide} />
              </Section>
              <Section id="blockers" title="Blockers" kicker="Symptom → fix">
                <Blockers guide={guide} />
              </Section>
              <Section id="ownership" title="What an agent can do vs where you take over">
                <OwnershipMatrix guide={guide} />
              </Section>
              <Section id="unknowns" title="What we couldn’t confirm">
                <Unknowns guide={guide} />
              </Section>
              <Section id="sources" title="Sources" kicker={`${guide.sources.length} cited`}>
                <SourceList guide={guide} />
              </Section>
            </div>

            <aside className="hidden lg:block">
              <nav aria-label="On this page" className="sticky top-20 space-y-6">
                <ul className="space-y-1 border-l text-sm">
                  {TOC.map(([id, label]) => (
                    <li key={id}>
                      <a href={`#${id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-muted-foreground hover:border-foreground hover:text-foreground">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
                <EvidenceLegend compact />
              </nav>
            </aside>
          </div>
        </div>
      </div>
    </SourcesProvider>
  );
}
