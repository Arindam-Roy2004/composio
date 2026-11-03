"use client";

import { ArrowRight, BookCheck, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { DIFFICULTY_META } from "@/lib/format";

type Lists = { library: GuideSummary[]; generated: GuideSummary[] };

/** ⌘K palette to jump to any guide or prefill a new generation. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lists, setLists] = useState<Lists | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // On the home page ⌘K focuses the generator input instead (it handles the event itself).
        if (document.getElementById("generate-input")) return;
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || lists) return;
    fetch("/api/guides")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.success && setLists(j.data))
      .catch(() => {});
  }, [open, lists]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const all = [...(lists?.library ?? []), ...(lists?.generated ?? [])];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden h-8 gap-2 rounded-full border-border bg-transparent pr-1.5 pl-3 text-muted-foreground sm:inline-flex"
      >
        <Search className="size-3.5" strokeWidth={1.5} />
        <span className="text-xs">Jump to a guide</span>
        <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="size-8 sm:hidden" aria-label="Search guides" onClick={() => setOpen(true)}>
        <Search className="size-4" strokeWidth={1.5} />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search guides" description="Jump to a guide or generate a new one">
        <CommandInput placeholder="Search guides or type an app name…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{lists ? "No guide yet." : "Loading…"}</CommandEmpty>
          {all.length > 0 && (
            <CommandGroup heading="Guides">
              {all.map((g) => (
                <CommandItem key={g.slug} value={`${g.appName} ${g.slug}`} onSelect={() => go(`/guide/${g.slug}`)}>
                  {g.generatedBy === "library" ? <BookCheck strokeWidth={1.5} /> : <Sparkles strokeWidth={1.5} />}
                  <span>{g.appName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{DIFFICULTY_META[g.difficulty].label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {query.trim().length >= 2 && (
            <CommandGroup heading="Generate">
              <CommandItem value={`generate ${query}`} onSelect={() => go(`/?q=${encodeURIComponent(query.trim())}#generate`)}>
                <ArrowRight strokeWidth={1.5} />
                <span>
                  Research <span className="font-medium">{query.trim()}</span>
                </span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
