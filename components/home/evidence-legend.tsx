import { EvidencePill } from "@/components/guide/evidence-badge";
import { EVIDENCE, type EvidenceLevel } from "@/lib/schema/guide.schema";
import { EVIDENCE_META } from "@/lib/format";
import { cn } from "@/lib/utils";

export function EvidenceLegend({ compact }: { compact?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-subtle-foreground uppercase">How we know</p>
      <ul className={cn(compact ? "space-y-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-5")}>
        {EVIDENCE.map((e: EvidenceLevel) => (
          <li key={e} className={cn(!compact && "rounded-lg border bg-card p-3")}>
            <EvidencePill evidence={e} />
            {!compact && <p className="mt-2 text-xs text-muted-foreground">{EVIDENCE_META[e].description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
