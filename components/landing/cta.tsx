import { GuidePreviewCard } from "@/components/landing/guide-preview-card";
import { CtaButton } from "@/components/landing/cta-button";
import type { Guide } from "@/lib/schema/guide.schema";

/** Closing call to action with a fanned deck of three real guide previews. */
export function Cta({ deck }: { deck: Guide[] }) {
  const [a, b, c] = deck;
  return (
    <div className="relative grid items-center gap-12 overflow-hidden rounded-3xl bg-muted/40 px-8 py-12 ring-1 ring-border sm:px-12 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h2 className="text-[32px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">
          Know the cost <span className="rounded-md bg-brand px-1.5 text-brand-foreground">before you register</span>
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">Open a guide from the library, or research any app in about two minutes.</p>
        <CtaButton />
      </div>
      <div className="relative mx-auto hidden h-[340px] w-[440px] sm:block" aria-hidden>
        {c && <GuidePreviewCard guide={c} href={false} className="absolute top-6 left-1/2 -translate-x-[78%] -rotate-[8deg] opacity-70" />}
        {b && <GuidePreviewCard guide={b} href={false} className="absolute top-3 left-1/2 -translate-x-[22%] rotate-[7deg] opacity-85" />}
        {a && <GuidePreviewCard guide={a} href={false} className="absolute top-0 left-1/2 -translate-x-1/2" />}
      </div>
    </div>
  );
}
