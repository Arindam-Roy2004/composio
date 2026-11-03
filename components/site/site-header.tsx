"use client";

import { Compass } from "@phosphor-icons/react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CommandPalette } from "@/components/site/command-palette";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#library", label: "Library" },
  { href: "/#faq", label: "FAQ" },
];

/** Floating glass bar: transparent at the top, condenses into a blurred pill on scroll. */
export function SiteHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));
  const solid = scrolled || pathname !== "/";

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <motion.div
        initial={false}
        animate={{ maxWidth: scrolled ? 920 : 1180 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 }}
        className={cn(
          "mx-auto flex h-12 items-center justify-between gap-3 rounded-2xl border px-2.5 pl-3.5 transition-[background-color,border-color,box-shadow] duration-300",
          solid ? "surface-glass border-border shadow-card" : "border-transparent",
        )}
      >
        <Link href="/" className="flex items-center gap-2 rounded-lg text-[15px] font-semibold tracking-tight" aria-label="OAuth Navigator home">
          <LogoMark />
          <span>OAuth Navigator</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          <div className="hidden items-center md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  pathname === "/" && "hover:bg-muted/60",
                )}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <CommandPalette />
          <ThemeToggle />
        </nav>
      </motion.div>
    </header>
  );
}

function LogoMark() {
  return (
    <span className="relative flex size-7 items-center justify-center rounded-lg bg-foreground text-background shadow-card">
      <Compass size={17} weight="duotone" aria-hidden />
    </span>
  );
}
