import type { Metadata } from "next";
import { GuidesBrowser } from "@/components/guides/guides-browser";
import { log } from "@/lib/log";
import { listGuides } from "@/lib/storage/guides";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guides", description: "Every OAuth setup guide: the hand-researched library and guides our agent has researched live." };

export default async function GuidesPage() {
  const lists = await listGuides().catch((err) => {
    log.error("listGuides failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  });
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6 sm:pt-14">
      {lists ? (
        <GuidesBrowser guides={[...lists.library, ...lists.generated]} />
      ) : (
        <p className="rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-border">The guide list is unavailable right now. Try again in a moment.</p>
      )}
    </div>
  );
}
