"use client";

import { ArrowRight, MagnifyingGlass, Sparkle, SealCheck } from "@phosphor-icons/react";
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
  const [failed, setFailed] = useState(false);
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
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        setFailed(false);
        if (j?.success) setLists(j.data);
      })
      .catch(() => setFailed(true));
  }, [open, lists]);

  // With a query, search every guide on the server (the default list only holds the library + recent).
  const [hits, setHits] = useState<GuideSummary[] | null>(null);
  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2) {
      setHits(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/guides/search?q=${encodeURIComponent(term)}&limit=8&sort=az`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((j) => j?.success && setHits(j.data.items as GuideSummary[]))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [open, query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const all = hits ?? [...(lists?.library ?? []), ...(lists?.generated ?? [])];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden h-8 gap-2 rounded-lg border-border bg-muted/40 pr-1.5 pl-2.5 text-muted-foreground hover:bg-muted sm:inline-flex"
      >
        <MagnifyingGlass size={14} />
        <span className="text-xs">Search guides</span>
        <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="size-8 rounded-lg sm:hidden" aria-label="Search guides" onClick={() => setOpen(true)}>
        <MagnifyingGlass size={17} />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search guides" description="Jump to a guide or generate a new one">
        <CommandInput placeholder="Search guides or type an app name…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{failed ? "Couldn’t load guides. Check your connection." : lists ? "No matching guide. Type an app name to research it." : "Loading guides…"}</CommandEmpty>
          {all.length > 0 && (
            <CommandGroup heading="Guides">
              {all.map((g) => (
                <CommandItem key={g.slug} value={`${g.appName} ${g.slug}`} onSelect={() => go(`/guide/${g.slug}`)}>
                  {g.generatedBy === "library" ? <SealCheck weight="duotone" className="text-ev-tested" /> : <Sparkle weight="duotone" />}
                  <span>{g.appName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{DIFFICULTY_META[g.difficulty].label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {query.trim().length >= 2 && (
            <CommandGroup heading="Generate">
              <CommandItem value={`generate ${query}`} onSelect={() => go(`/?q=${encodeURIComponent(query.trim())}#generate`)}>
                <ArrowRight />
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
