import type { Metadata } from "next";
import { GuidesBrowser } from "@/components/guides/guides-browser";
import { GuideQuerySchema } from "@/lib/guides/query";
import { log } from "@/lib/log";
import { searchGuides } from "@/lib/storage/guides";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guides", description: "Every OAuth setup guide: the hand-researched library and guides our agent has researched live." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function GuidesPage({ searchParams }: Props) {
  // Filters live in the URL so a filtered view is shareable. Invalid params fall back to defaults.
  const raw = Object.fromEntries(Object.entries(await searchParams).filter(([k, v]) => typeof v === "string" && ["q", "source", "difficulty", "sort"].includes(k)));
  const parsed = GuideQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : GuideQuerySchema.parse({});
  const initial = await searchGuides(query).catch((err) => {
    log.error("searchGuides failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  });
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6 sm:pt-14">
      {initial ? (
        <GuidesBrowser initial={initial} initialFilters={{ q: query.q, source: query.source, difficulty: query.difficulty, sort: query.sort }} />
      ) : (
        <p className="rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-border">The guide list is unavailable right now. Try again in a moment.</p>
      )}
    </div>
  );
}
