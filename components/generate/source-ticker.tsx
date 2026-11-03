"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AppLogo } from "@/components/site/app-logo";

export function SourceTicker({ reads }: { reads: { url: string; title: string; domain: string }[] }) {
  const reduce = useReducedMotion();
  if (!reads.length) return <p className="text-xs text-subtle-foreground">Pages the agent reads will appear here.</p>;
  const byDomain = new Map<string, { url: string; domain: string; titles: string[] }>();
  for (const r of reads) {
    const g = byDomain.get(r.domain) ?? { url: r.url, domain: r.domain, titles: [] };
    g.titles.push(r.title);
    byDomain.set(r.domain, g);
  }
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Pages read">
      <AnimatePresence initial={false}>
        {[...byDomain.values()].map((r) => (
          <motion.li
            key={r.domain}
            initial={reduce ? false : { opacity: 0, x: -8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            title={r.titles.join("\n")}
            className="flex max-w-[220px] items-center gap-1.5 rounded-full border bg-card py-0.5 pr-2.5 pl-0.5"
          >
            <AppLogo name={r.domain} website={r.url} size={18} className="rounded-full" />
            <span className="truncate font-mono text-[11px] text-muted-foreground">{r.domain}</span>
            {r.titles.length > 1 && <span className="font-mono text-[10px] text-subtle-foreground">×{r.titles.length}</span>}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
