import { DIFFICULTY_META } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

type Difficulty = Guide["verdict"]["difficulty"];

const SCALE = ["easy", "moderate", "hard", "gated"] as const;
const BG = { easy: "bg-diff-easy", moderate: "bg-diff-moderate", hard: "bg-diff-hard", gated: "bg-diff-gated" } as const;
const TEXT = { easy: "text-diff-easy", moderate: "text-diff-moderate", hard: "text-diff-hard", gated: "text-diff-gated", unknown: "text-muted-foreground" } as const;

/**
 * Difficulty as a category bar: the whole scale is always visible, the current level is lit
 * and marked, so "hard" reads as "third of four" rather than an isolated word.
 */
export function DifficultyMeter({ difficulty, compact }: { difficulty: Difficulty; compact?: boolean }) {
  const meta = DIFFICULTY_META[difficulty];
  const idx = SCALE.indexOf(difficulty as (typeof SCALE)[number]);
  const rated = idx >= 0;

  const bar = (
    <div className={cn("relative flex w-full gap-[3px]", compact ? "h-1" : "h-1.5")} aria-hidden>
      {SCALE.map((level, i) => (
        <span
          key={level}
          className={cn("relative flex-1 rounded-full transition-opacity", rated ? BG[level] : "bg-muted", rated && i !== idx && "opacity-25")}
        >
          {i === idx && !compact && (
            <span className="absolute -top-[5px] left-1/2 h-[16px] w-[3px] -translate-x-1/2 rounded-full bg-foreground ring-2 ring-background" />
          )}
        </span>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3" role="img" aria-label={`Difficulty: ${meta.label}`}>
        <div className="w-20 shrink-0">{bar}</div>
        <span className={cn("text-xs font-medium", TEXT[difficulty])}>{meta.label}</span>
      </div>
    );
  }

  return (
    <div role="img" aria-label={rated ? `Difficulty: ${meta.label}, level ${idx + 1} of 4` : "Difficulty: not rated"}>
      <p className={cn("text-[22px] leading-none font-semibold tracking-[-0.02em]", TEXT[difficulty])}>{meta.label}</p>
      <div className="mt-4">{bar}</div>
      <div className="mt-2 grid grid-cols-4 text-[10.5px] text-subtle-foreground">
        {SCALE.map((level, i) => (
          <span key={level} className={cn("text-center", i === idx && cn("font-medium", TEXT[level]))}>
            {DIFFICULTY_META[level].label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-[11px] font-medium ring-1 ring-current/20", TEXT[difficulty])}>
      {DIFFICULTY_META[difficulty].label}
    </span>
  );
}
