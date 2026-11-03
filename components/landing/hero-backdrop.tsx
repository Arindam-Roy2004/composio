"use client";

import { useReducedMotion } from "motion/react";
import { Marquee } from "@/components/ui/marquee";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { DIFFICULTY_META, formatMinutes, summaryApproval } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tile = { title: string; meta: string; tone: "easy" | "moderate" | "hard" | "gated" | "plain"; lines: number };

const DOT = { easy: "bg-diff-easy", moderate: "bg-diff-moderate", hard: "bg-diff-hard", gated: "bg-diff-gated", plain: "bg-own-provider" } as const;

/** Generic UI fragments (not claims about any provider) mixed with real library summaries. */
const GENERIC: Tile[] = [
  { title: "Redirect URIs", meta: "https://app.example.dev/callback", tone: "plain", lines: 2 },
  { title: "Consent screen", meta: "scopes · privacy URL · logo", tone: "plain", lines: 3 },
  { title: "Client credentials", meta: "client_id ••••••  secret ••••••", tone: "plain", lines: 1 },
  { title: "PKCE", meta: "code_challenge_method=S256", tone: "plain", lines: 2 },
  { title: "App review", meta: "submitted · waiting on provider", tone: "plain", lines: 3 },
  { title: "Test users", meta: "unpublished app · limited", tone: "plain", lines: 2 },
  { title: "Refresh tokens", meta: "rotate on every use", tone: "plain", lines: 2 },
  { title: "Scopes", meta: "basic · sensitive · restricted", tone: "plain", lines: 3 },
];

function tilesFrom(guides: GuideSummary[]): Tile[] {
  const real: Tile[] = guides.map((g) => ({
    title: g.appName,
    meta: `${DIFFICULTY_META[g.difficulty].label} · ~${formatMinutes(g.activeSetup.minMinutes, g.activeSetup.maxMinutes)} · ${summaryApproval(g)}`,
    tone: g.difficulty,
    lines: 2,
  }));
  const out: Tile[] = [];
  for (let i = 0; i < Math.max(GENERIC.length, real.length * 2); i++) {
    out.push(GENERIC[i % GENERIC.length]!);
    if (real.length) out.push(real[i % real.length]!);
  }
  return out;
}

function MiniCard({ tile }: { tile: Tile }) {
  return (
    <div className="w-60 rounded-xl border bg-card/90 p-3.5 shadow-card">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", DOT[tile.tone])} aria-hidden />
        <span className="truncate text-[13px] font-medium">{tile.title}</span>
      </div>
      <p className="mt-1.5 truncate font-mono text-[10.5px] text-subtle-foreground">{tile.meta}</p>
      <div className="mt-3 space-y-1.5" aria-hidden>
        {Array.from({ length: tile.lines }, (_, i) => (
          <div key={i} className="h-1.5 rounded-full bg-muted" style={{ width: `${88 - i * 19}%` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Landing backdrop: a tilted, slowly drifting wall of setup-guide fragments, a breathing focal glow
 * and a diagonal light sweep. Decorative only (aria-hidden); frozen under reduced motion.
 */
export function HeroBackdrop({ guides }: { guides: GuideSummary[] }) {
  const reduce = useReducedMotion();
  const tiles = tilesFrom(guides);
  const cols = 12;
  const columns = Array.from({ length: cols }, (_, c) => tiles.filter((_, i) => i % cols === c).concat(tiles.slice(c, c + 2)));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Tilted wall */}
      <div className="absolute inset-0 [perspective:1400px]">
        <div
          className="absolute top-[-40%] left-1/2 flex h-[190%] w-max justify-center gap-5 opacity-[0.55] dark:opacity-[0.42]"
          style={{ transform: "translateX(-50%) rotateX(38deg) rotateZ(-22deg)" }}
        >
          {columns.map((col, c) => (
            <Marquee
              key={c}
              vertical
              reverse={c % 2 === 1}
              repeat={2}
              className={cn("[--gap:1.25rem] p-0", reduce && "[&_*]:![animation-play-state:paused]")}
              style={{ ["--duration" as string]: `${70 + c * 9}s` }}
            >
              {col.map((t, i) => (
                <MiniCard key={i} tile={t} />
              ))}
            </Marquee>
          ))}
        </div>
      </div>

      {/* Vignette keeps the centre readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_42%,var(--background)_22%,color-mix(in_oklch,var(--background)_55%,transparent)_55%,transparent_85%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />

      {/* Focal glow behind the input */}
      <div className="absolute top-[34%] left-1/2 h-[420px] w-[760px] max-w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--brand-glow),transparent)] blur-2xl motion-safe:animate-glow-breathe" />

      {/* Diagonal light sweep */}
      <div className="absolute top-[18%] -left-1/4 h-40 w-[150%] bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--foreground)_7%,transparent)_45%,color-mix(in_oklch,var(--foreground)_12%,transparent)_50%,color-mix(in_oklch,var(--foreground)_7%,transparent)_55%,transparent)] blur-2xl motion-safe:animate-light-sweep motion-reduce:hidden" />
    </div>
  );
}
