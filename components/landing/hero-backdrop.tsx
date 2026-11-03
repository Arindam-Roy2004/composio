"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ShaderBackground } from "@/components/motion/shader-background";

/** God-rays light fan from above the fold (beUI shader-background). Frozen under reduced motion. */
export function HeroBackdrop() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const light = mounted && resolvedTheme === "light";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden>
      {mounted && (
        <ShaderBackground
          key={light ? "light" : "dark"}
          variant="god-rays"
          className="absolute inset-0"
          offsetX={0}
          offsetY={-1.05}
          colorBack={light ? "#fbfbfb" : "#0b0b0d"}
          colorBloom={light ? "#ffd9bf" : "#3b2012"}
          colors={light ? ["#ff7a2fa0", "#3aa8bd90", "#ffb08aa0", "#ffffff"] : ["#ff7a2fd0", "#ffb38099", "#3aa8bdaa", "#ffffff73"]}
          density={0.55}
          spotty={0.22}
          midSize={0.12}
          midIntensity={0.3}
          intensity={light ? 0.8 : 0.85}
          bloom={0.45}
          speed={0.35}
        />
      )}
      {/* soften the rays and fade into the page */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-background via-background/85 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_55%,color-mix(in_oklch,var(--background)_70%,transparent),transparent)]" />
    </div>
  );
}
