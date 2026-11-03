"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { TiltedShots } from "@/components/landing/tilted-shots";

const COUNT = 20;
const shots = (theme: "dark" | "light") => Array.from({ length: COUNT }, (_, i) => `/hero/${theme}/${String(i + 1).padStart(2, "0")}.jpg`);

/**
 * Landing backdrop: a 3D marquee of real screenshots of our own guide pages (scripts/capture-hero-shots.ts),
 * a breathing focal glow and a diagonal light sweep. Decorative only; frozen under reduced motion.
 */
export function HeroBackdrop() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden>
      <div className="absolute inset-0 opacity-80 dark:opacity-70">
        <TiltedShots key={theme} images={shots(theme)} />
      </div>

      {/* Vignette keeps the headline and input readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_46%_50%_at_50%_44%,var(--background)_35%,color-mix(in_oklch,var(--background)_72%,transparent)_62%,color-mix(in_oklch,var(--background)_25%,transparent)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />

      {/* Focal glow behind the input */}
      <div className="absolute top-[38%] left-1/2 h-[420px] w-[760px] max-w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--brand-glow),transparent)] blur-2xl motion-safe:animate-glow-breathe" />

      {/* Diagonal light sweep */}
      <div className="absolute top-[18%] -left-1/4 h-40 w-[150%] bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--foreground)_6%,transparent)_45%,color-mix(in_oklch,var(--foreground)_11%,transparent)_50%,color-mix(in_oklch,var(--foreground)_6%,transparent)_55%,transparent)] blur-2xl motion-safe:animate-light-sweep motion-reduce:hidden" />
    </div>
  );
}
