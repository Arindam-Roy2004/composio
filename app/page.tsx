import { Suspense } from "react";
import { GenerateBox } from "@/components/generate/generate-box";
import { HowItWorks } from "@/components/home/how-it-works";
import { LibraryGrid } from "@/components/home/library-grid";
import { Reveal } from "@/components/site/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { listGuides } from "@/lib/storage/guides";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lists = await listGuides().catch((err) => {
    log.error("listGuides failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  });

  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[560px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-3xl bg-[radial-gradient(closest-side,var(--brand-glow),transparent)] opacity-60" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <section className="mx-auto max-w-3xl pt-16 pb-14 text-center sm:pt-24">
          <Reveal>
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-ev-tested" aria-hidden />
              Every claim labelled: tested, probed, documented, community or uncertain
            </p>
          </Reveal>
          <Reveal index={1}>
            <h1 className="mt-6 text-display font-semibold text-balance">Know what you’re signing up for before you register an OAuth app</h1>
          </Reveal>
          <Reveal index={2}>
            <p className="mx-auto mt-5 max-w-xl text-base text-balance text-muted-foreground sm:text-lg">
              Some providers take ten minutes, others take six weeks of review. See the active work, the approval wait, the steps and the blockers, with sources, before you start.
            </p>
          </Reveal>
          <Reveal index={3} className="mt-8">
            <Suspense fallback={<Skeleton className="h-[106px] w-full rounded-2xl" />}>
              <GenerateBox />
            </Suspense>
          </Reveal>
        </section>

        <div className="space-y-16 pb-8">
          {lists ? (
            <LibraryGrid library={lists.library} generated={lists.generated} />
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">The guide list is unavailable right now. Library guides are still reachable from ⌘K.</p>
          )}
          <HowItWorks />
        </div>
      </div>
    </div>
  );
}
