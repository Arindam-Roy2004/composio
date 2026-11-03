import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";
import { GenerateBox } from "@/components/generate/generate-box";
import { Bento } from "@/components/landing/bento";
import { Cta } from "@/components/landing/cta";
import { Faq } from "@/components/landing/faq";
import { GuideStrip } from "@/components/landing/guide-strip";
import { HeroBackdrop } from "@/components/landing/hero-backdrop";
import { Reveal } from "@/components/site/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { log } from "@/lib/log";
import { getGuide, listGuides } from "@/lib/storage/guides";
import type { Guide } from "@/lib/schema/guide.schema";

export const dynamic = "force-dynamic";

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Reveal inView>
      <h2 id={id} className="mx-auto max-w-2xl text-center text-[32px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">
        {children}
      </h2>
    </Reveal>
  );
}

const Mark = ({ children }: { children: React.ReactNode }) => <span className="rounded-md bg-brand px-1.5 text-brand-foreground">{children}</span>;

export default async function Home() {
  const lists = await listGuides().catch((err) => {
    log.error("listGuides failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  });
  const slugs = [...(lists?.library ?? []), ...(lists?.generated ?? [])].map((g) => g.slug).slice(0, 12);
  const guides = (await Promise.all(slugs.map((s) => getGuide(s)))).filter((g): g is Guide => g !== null);
  const gmail = guides.find((g) => g.slug === "gmail");
  const github = guides.find((g) => g.slug === "github");
  const deck = ["gmail", "slack", "github"].map((s) => guides.find((g) => g.slug === s)).filter((g): g is Guide => Boolean(g));

  return (
    <>
      <section className="relative -mt-[60px] overflow-hidden pt-[60px]" aria-labelledby="hero-title">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-3xl px-4 pt-28 pb-32 text-center sm:px-6 sm:pt-40 sm:pb-44">
          <Reveal>
            <h1 id="hero-title" className="text-[40px] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-[56px]">
              Know what an OAuth app costs you before you register it
            </h1>
          </Reveal>
          <Reveal index={2} className="mx-auto mt-10 max-w-2xl">
            <Suspense fallback={<Skeleton className="h-[106px] w-full rounded-2xl" />}>
              <GenerateBox />
            </Suspense>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-32 px-4 pb-28 sm:px-6">
        {gmail && github && (
          <section aria-labelledby="features-title">
            <Heading id="features-title">
              The whole setup, mapped. <Mark>Not guessed</Mark>
            </Heading>
            <Reveal inView className="mt-12">
              <Bento gmail={gmail} github={github} />
            </Reveal>
          </section>
        )}

        {guides.length > 0 && (
          <section id="library" aria-labelledby="library-title" className="scroll-mt-24">
            <Heading id="library-title">
              Five apps, five setup stories, <Mark>ready to read</Mark>
            </Heading>
            <Reveal inView className="mt-12">
              <GuideStrip guides={guides.filter((g) => g.generatedBy === "library")} />
            </Reveal>
            <div className="mt-8 text-center">
              <Link href="/guides" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted hover:text-foreground">
                Browse all guides, including AI-generated ones <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        )}

        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24">
          <Heading id="faq-title">
            Frequently asked <Mark>questions</Mark>
          </Heading>
          <Reveal inView className="mx-auto mt-12 max-w-2xl">
            <Faq />
          </Reveal>
        </section>

        <Reveal inView>
          <Cta deck={deck} />
        </Reveal>
      </div>
    </>
  );
}
