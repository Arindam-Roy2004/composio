import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GuideNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border bg-card">
        <Compass className="size-5 text-muted-foreground" strokeWidth={1.5} />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">No guide here yet</h1>
      <p className="mt-2 text-muted-foreground">We haven’t researched this app. Our agent can investigate it live in about two minutes.</p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/#generate">
            Generate this guide <ArrowRight strokeWidth={1.5} />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/#library">Browse the library</Link>
        </Button>
      </div>
    </div>
  );
}
