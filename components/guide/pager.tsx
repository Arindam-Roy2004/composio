import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { DIFFICULTY_META } from "@/lib/format";

/** Previous / next guide, like docs page navigation. */
export function Pager({ prev, next }: { prev?: GuideSummary; next?: GuideSummary }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="More guides" className="grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link href={`/guide/${prev.slug}`} className="group rounded-xl p-4 ring-1 ring-border transition-colors hover:bg-muted/40">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> {prev.appName}
          </span>
          <span className="mt-0.5 block pl-5 text-xs text-subtle-foreground">{DIFFICULTY_META[prev.difficulty].label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={`/guide/${next.slug}`} className="group rounded-xl p-4 text-right ring-1 ring-border transition-colors hover:bg-muted/40 sm:col-start-2">
          <span className="flex items-center justify-end gap-1.5 text-sm font-medium">
            {next.appName} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-0.5 block pr-5 text-xs text-subtle-foreground">{DIFFICULTY_META[next.difficulty].label}</span>
        </Link>
      )}
    </nav>
  );
}
