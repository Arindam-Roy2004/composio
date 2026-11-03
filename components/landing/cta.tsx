"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const PICKS = [11, 7, 19, 4];

export function Cta() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";
  return (
    <div className="relative grid items-center gap-10 overflow-hidden rounded-3xl bg-muted/40 p-8 ring-1 ring-border sm:p-12 lg:grid-cols-2">
      <div>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
          Know the cost <span className="rounded-md bg-brand px-1.5 text-brand-foreground">before you register</span>
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">Pick an app from the library, or research a new one in about two minutes.</p>
        <Button
          className="mt-7 h-10 rounded-xl bg-brand px-4 text-brand-foreground hover:bg-brand/90"
          onClick={() => {
            const input = document.getElementById("generate-input") as HTMLInputElement | null;
            input?.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => input?.focus({ preventScroll: true }), 400);
          }}
        >
          Research an app <ArrowRight size={15} />
        </Button>
      </div>
      <div className="relative h-72 [perspective:1400px]" aria-hidden>
        <div className="absolute inset-0 grid grid-cols-2 gap-3" style={{ transform: "rotateX(18deg) rotateZ(-10deg) translateY(-4%)" }}>
          {PICKS.map((n, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- decorative local screenshot
            <img
              key={n}
              src={`/hero/${theme}/${String(n).padStart(2, "0")}.jpg`}
              alt=""
              loading="lazy"
              className="aspect-[970/700] w-full rounded-xl object-cover object-top shadow-[0_30px_70px_-30px_oklch(0_0_0/60%)] ring-1 ring-border"
              style={{ transform: `translateY(${i % 2 ? 24 : 0}px)` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
