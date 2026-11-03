import { DIFFICULTY_META } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

const COLOR = { easy: "bg-diff-easy", moderate: "bg-diff-moderate", hard: "bg-diff-hard", gated: "bg-diff-gated" } as const;
const TEXT = { easy: "text-diff-easy", moderate: "text-diff-moderate", hard: "text-diff-hard", gated: "text-diff-gated" } as const;

export function DifficultyMeter({ difficulty, compact }: { difficulty: Guide["verdict"]["difficulty"]; compact?: boolean }) {
  const meta = DIFFICULTY_META[difficulty];
  return (
    <div className="flex items-center gap-2.5" role="img" aria-label={`Difficulty: ${meta.label}, ${meta.level} of 4`}>
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 rounded-full", compact ? "w-3" : "w-6", i <= meta.level ? COLOR[difficulty] : "bg-muted")} />
        ))}
      </div>
      <span className={cn("font-medium", compact ? "text-xs" : "text-sm", TEXT[difficulty])}>{meta.label}</span>
    </div>
  );
}

export function DifficultyPill({ difficulty }: { difficulty: Guide["verdict"]["difficulty"] }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium", TEXT[difficulty])}>
      <span className={cn("size-1.5 rounded-full", COLOR[difficulty])} aria-hidden />
      {DIFFICULTY_META[difficulty].label}
    </span>
  );
}
