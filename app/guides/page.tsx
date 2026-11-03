import type { Metadata } from "next";
import { GuidesBrowser } from "@/components/guides/guides-browser";
import { log } from "@/lib/log";
import { listGuides } from "@/lib/storage/guides";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All guides", description: "Every OAuth setup guide: the reviewed library and guides our agent has researched." };

export default async function GuidesPage() {
  const lists = await listGuides().catch((err) => {
    log.error("listGuides failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  });
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6 sm:pt-14">
      <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] sm:text-[40px]">All guides</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        The library is researched by hand from official docs. AI-generated guides were researched live by our agent and labelled with how each fact is known.
      </p>
      <div className="mt-8">
        {lists ? (
          <GuidesBrowser guides={[...lists.library, ...lists.generated]} />
        ) : (
          <p className="rounded-2xl bg-muted/30 p-8 text-center text-sm text-muted-foreground ring-1 ring-border">The guide list is unavailable right now. Try again in a moment.</p>
        )}
      </div>
    </div>
  );
}
