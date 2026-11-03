import { GuidePreviewCard } from "@/components/landing/guide-preview-card";
import { Marquee } from "@/components/ui/marquee";
import type { Guide } from "@/lib/schema/guide.schema";

/** One row of live guide previews drifting sideways; pauses on hover. */
export function GuideStrip({ guides }: { guides: Guide[] }) {
  return (
    <div className="relative -mx-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] sm:-mx-6">
      <Marquee pauseOnHover repeat={3} className="[--duration:55s] [--gap:1rem] p-0 py-2">
        {guides.map((g) => (
          <GuidePreviewCard key={g.slug} guide={g} />
        ))}
      </Marquee>
    </div>
  );
}
