import { EvidencePill } from "@/components/guide/evidence-badge";
import { EVIDENCE_META } from "@/lib/format";
import { EVIDENCE } from "@/lib/schema/guide.schema";

/** The evidence taxonomy as a scale from strongest to weakest, not a grid of boxes. */
export function EvidenceScale() {
  return (
    <div>
      <div className="relative">
        <div className="absolute inset-x-0 top-[11px] h-px bg-gradient-to-r from-ev-tested via-ev-documented to-ev-uncertain opacity-50" aria-hidden />
        <ol className="relative grid gap-8 sm:grid-cols-5 sm:gap-4">
          {EVIDENCE.map((e) => (
            <li key={e}>
              <EvidencePill evidence={e} className="bg-background" />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{EVIDENCE_META[e].description}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-6 flex justify-between font-mono text-[11px] text-subtle-foreground">
        <span>Strongest</span>
        <span>Weakest</span>
      </div>
    </div>
  );
}
