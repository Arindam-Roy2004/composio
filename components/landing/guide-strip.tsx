"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AppLogo } from "@/components/site/app-logo";
import { Marquee } from "@/components/ui/marquee";
import { DIFFICULTY_META } from "@/lib/format";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

// Screenshot order from scripts/capture-hero-shots.ts: sections × slugs.
const SHOT_SLUGS = ["github", "notion", "slack", "gmail", "linkedin"];
const DIFF = { easy: "text-diff-easy", moderate: "text-diff-moderate", hard: "text-diff-hard", gated: "text-diff-gated" } as const;

function shot(theme: string, slug: string, section: number) {
  const i = SHOT_SLUGS.indexOf(slug);
  return i < 0 ? null : `/hero/${theme}/${String(section * SHOT_SLUGS.length + i + 1).padStart(2, "0")}.jpg`;
}

function ShotCard({ g, src }: { g: GuideSummary; src: string | null }) {
  return (
    <Link href={`/guide/${g.slug}`} className="group block w-[340px] shrink-0 sm:w-[400px]">
      <div className="relative aspect-[970/700] overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- local pre-sized screenshot
          <img src={src} alt={`${g.appName} guide preview`} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <AppLogo name={g.appName} website={g.website} size={56} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pt-10 pb-3.5">
          <AppLogo name={g.appName} website={g.website} size={26} />
          <span className="text-sm font-medium">{g.appName}</span>
          <span className={cn("text-xs", DIFF[g.difficulty])}>{DIFFICULTY_META[g.difficulty].label}</span>
          <ArrowUpRight size={15} className="ml-auto text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}

/** Two counter-scrolling rows of real guide screenshots; pauses on hover. */
export function GuideStrip({ guides }: { guides: GuideSummary[] }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";
  return (
    <div className="relative -mx-4 space-y-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:-mx-6">
      <Marquee pauseOnHover repeat={3} className="[--duration:60s] [--gap:1rem] p-0">
        {guides.map((g) => (
          <ShotCard key={g.slug} g={g} src={shot(theme, g.slug, 0)} />
        ))}
      </Marquee>
      <Marquee pauseOnHover reverse repeat={3} className="[--duration:70s] [--gap:1rem] p-0">
        {guides.map((g) => (
          <ShotCard key={g.slug} g={g} src={shot(theme, g.slug, 1)} />
        ))}
      </Marquee>
    </div>
  );
}
