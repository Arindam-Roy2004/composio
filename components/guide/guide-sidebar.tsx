"use client";

import { MagnifyingGlass, Plus, SealCheck, Sparkle, SquaresFour } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/site/app-logo";
import { DIFFICULTY_META } from "@/lib/format";
import type { GuideSummary } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

const DIFF_TEXT = { easy: "text-diff-easy", moderate: "text-diff-moderate", hard: "text-diff-hard", gated: "text-diff-gated", unknown: "text-muted-foreground" } as const;

function openPalette() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

/** Docs-style left rail: search, the library, and recently generated guides. */
export function GuideSidebar({ library, generated }: { library: GuideSummary[]; generated: GuideSummary[] }) {
  const pathname = usePathname();
  return (
    <div className="flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-border">
      <div className="p-2.5">
        <button
          type="button"
          onClick={openPalette}
          className="flex h-9 w-full items-center gap-2 rounded-xl bg-background px-3 text-sm text-subtle-foreground ring-1 ring-border transition-colors hover:text-foreground"
        >
          <MagnifyingGlass size={15} />
          <span className="flex-1 text-left">Quick search</span>
          <kbd className="rounded-md bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
        </button>
      </div>
      <nav aria-label="Guides" className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3 [scrollbar-width:thin]">
        <Group title="Library" icon={<SealCheck size={13} weight="fill" className="text-ev-tested" />} items={library} pathname={pathname} />
        {generated.length > 0 && <Group title="Recently generated" icon={<Sparkle size={13} weight="duotone" />} items={generated.slice(0, 6)} pathname={pathname} />}
        <Link href="/guides" className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-background hover:text-foreground">
          <SquaresFour size={14} /> View all guides
        </Link>
        <Link
          href="/#generate"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Plus size={14} /> Research another app
        </Link>
      </nav>
    </div>
  );
}

function Group({ title, icon, items, pathname }: { title: string; icon: React.ReactNode; items: GuideSummary[]; pathname: string }) {
  return (
    <div className="mt-2 first:mt-0">
      <p className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">
        {icon}
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((g) => {
          const active = pathname === `/guide/${g.slug}`;
          return (
            <li key={g.slug}>
              <Link
                href={`/guide/${g.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                  active ? "bg-background font-medium text-foreground shadow-card ring-1 ring-border" : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                )}
              >
                <AppLogo name={g.appName} website={g.website} size={22} className="rounded-md" />
                <span className="min-w-0 flex-1 truncate">{g.appName}</span>
                <span className={cn("text-[10.5px]", DIFF_TEXT[g.difficulty])}>{DIFFICULTY_META[g.difficulty].label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Horizontal guide switcher for small screens. */
export function GuideSwitcherMobile({ library, current }: { library: GuideSummary[]; current: string }) {
  return (
    <nav aria-label="Guides" className="-mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden">
      {library.map((g) => (
        <Link
          key={g.slug}
          href={`/guide/${g.slug}`}
          aria-current={g.slug === current ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg py-1 pr-2.5 pl-1 text-xs ring-1 ring-border",
            g.slug === current ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground",
          )}
        >
          <AppLogo name={g.appName} website={g.website} size={18} className="rounded-[5px] border-0" />
          {g.appName}
        </Link>
      ))}
    </nav>
  );
}
