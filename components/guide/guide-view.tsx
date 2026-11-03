"use client";

import { BookOpen, Code } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Guide / Markdown segmented switch, like a docs page's Preview / Code tabs. */
export function GuideView({ markdown, actions, children }: { markdown: string; actions: React.ReactNode; children: React.ReactNode }) {
  const [view, setView] = useState<"guide" | "markdown">("guide");
  const reduce = useReducedMotion();
  const tabs = [
    { id: "guide" as const, label: "Guide", icon: BookOpen },
    { id: "markdown" as const, label: "Markdown", icon: Code },
  ];
  return (
    <>
      <div className="mt-7 flex items-center justify-between gap-3">
        <div role="tablist" aria-label="View" className="inline-flex rounded-xl bg-muted/60 p-1 ring-1 ring-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view === t.id}
              onClick={() => setView(t.id)}
              className={cn("relative flex h-7 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors", view === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {view === t.id && <motion.span layoutId="guide-view" className="absolute inset-0 rounded-lg bg-background shadow-card ring-1 ring-border" transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.15, duration: 0.35 }} />}
              <t.icon size={14} className="relative" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        {actions}
      </div>
      {view === "guide" ? (
        children
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-muted/40 p-1.5 ring-1 ring-border">
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span className="font-mono">guide.md</span>
            <span>{markdown.split("\n").length} lines</span>
          </div>
          <pre className="max-h-[70vh] overflow-auto rounded-xl bg-background p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-muted-foreground ring-1 ring-border">
            {markdown}
          </pre>
        </div>
      )}
    </>
  );
}
