"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/site/command-palette";
import { ThemeToggle } from "@/components/site/theme-toggle";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-200",
        scrolled && "border-border bg-background/70 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-md text-sm font-medium tracking-tight">
          <LogoMark />
          <span>OAuth Navigator</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link href="/#library" className="hidden rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:block">
            Library
          </Link>
          <Link href="/#how" className="hidden rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:block">
            How it works
          </Link>
          <CommandPalette />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none">
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" className="stroke-border-strong" strokeWidth="1" />
      <path d="M7 12h4m2 0h4M12 7v4m0 2v4" className="stroke-brand" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.6" className="fill-foreground" />
    </svg>
  );
}
