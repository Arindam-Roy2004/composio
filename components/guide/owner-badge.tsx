import { HourglassMedium, Robot, User } from "@phosphor-icons/react";
import { OWNER_META } from "@/lib/format";
import type { Step } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

const ICON = { agent: Robot, human: User, provider: HourglassMedium } as const;
export const OWNER_TONE = {
  agent: "text-own-agent border-own-agent/35 bg-own-agent/10",
  human: "text-own-human border-own-human/35 bg-own-human/10",
  provider: "text-own-provider border-own-provider/40 bg-own-provider/10",
} as const;

export function OwnerBadge({ owner, className }: { owner: Step["owner"]; className?: string }) {
  const Icon = ICON[owner];
  return (
    <span className={cn("inline-flex h-[22px] items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium", OWNER_TONE[owner], className)}>
      <Icon size={12} weight="duotone" aria-hidden />
      {OWNER_META[owner].short}
    </span>
  );
}
