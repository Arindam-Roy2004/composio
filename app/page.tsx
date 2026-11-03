import { Suspense } from "react";
import { GenerateBox } from "@/components/generate/generate-box";
import { LibraryGrid } from "@/components/home/library-grid";
import { EvidenceScale } from "@/components/landing/evidence-scale";
import { HeroBackdrop } from "@/components/landing/hero-backdrop";
import { Pipeline } from "@/components/landing/pipeline";
import { ProductFrame } from "@/components/landing/product-frame";
import { Reveal } from "@/components/site/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { log } from "@/lib/log";
import { getGuide, listGuides } from "@/lib/storage/guides";

export const dynamic = "force-dynamic";

function SectionHeading({ id, eyebrow, title, body }: { id: string; eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs text-brand">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground text-balance">{body}</p>
    </div>
  );
}

export default async function Home() {
  const lists = await listGuides().catch((err) => {
    log.error("listGuides failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  });
  const featured = lists?.library[0] ? await getGuide(lists.library[0].slug) : null;
  const all = [...(lists?.library ?? []), ...(lists?.generated ?? [])];

  return (
    <>
      <section className="relative -mt-[60px] overflow-hidden pt-[60px]" aria-labelledby="hero-title">
        <HeroBackdrop guides={all} />
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-24 text-center sm:px-6 sm:pt-28 sm:pb-32">
          <Reveal>
            <h1 id="hero-title" className="text-gradient text-display font-semibold text-balance">
              Know what an OAuth app will cost you before you register it
            </h1>
          </Reveal>
          <Reveal index={2}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-balance text-muted-foreground sm:text-lg">
              Some providers hand you keys in ten minutes. Others need weeks of review. See the hands-on work, the approval wait and the blockers, with a source for every claim.
            </p>
          </Reveal>
          <Reveal index={4} className="mx-auto mt-10 max-w-2xl">
            <Suspense fallback={<Skeleton className="h-[112px] w-full rounded-2xl" />}>
              <GenerateBox />
            </Suspense>
          </Reveal>
        </div>
      </section>

      {featured && (
        <section className="relative px-4 pb-24 sm:px-6" aria-label="Example guide">
          <ProductFrame guide={featured} />
        </section>
      )}

      <div className="mx-auto max-w-6xl space-y-28 px-4 pb-24 sm:px-6">
        <section id="library" aria-labelledby="library-title" className="scroll-mt-24">
          <SectionHeading
            id="library-title"
            eyebrow="Library"
            title="Five apps, five very different setup stories"
            body="Picked to cover the whole range, from a two-minute registration to partner programmes that can say no. Each has been reviewed against the provider’s docs."
          />
          <div className="mt-10">
            {lists ? (
              <LibraryGrid library={lists.library} generated={lists.generated} />
            ) : (
              <p className="rounded-2xl bg-muted/30 p-8 text-center text-sm text-muted-foreground">The guide list is unavailable right now. Try again in a moment, or press ⌘K.</p>
            )}
          </div>
        </section>

        <section id="how" aria-labelledby="how-title" className="scroll-mt-24">
          <SectionHeading
            id="how-title"
            eyebrow="How it works"
            title="A fixed pipeline with one bounded research loop"
            body="The agent can search and read, but it runs on a budget and inside guard rails. A plain verifier, not another model, decides which labels a claim keeps."
          />
          <div className="mt-12">
            <Pipeline />
          </div>
        </section>

        <section id="evidence" aria-labelledby="evidence-title" className="scroll-mt-24">
          <SectionHeading
            id="evidence-title"
            eyebrow="Evidence"
            title="Every claim says how we know it"
            body="An approval timeline from a forum post isn’t the same as one from the provider’s policy page. The label sits next to the claim, and hovering it shows the source."
          />
          <div className="mt-12">
            <EvidenceScale />
          </div>
        </section>
      </div>
    </>
  );
}
