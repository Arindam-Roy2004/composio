"use client";

import { motion, useReducedMotion } from "motion/react";

/** Fade-up on mount with an optional stagger index (40ms). Disabled under reduced motion. */
export function Reveal({ children, index = 0, className, as = "div" }: { children: React.ReactNode; index?: number; className?: string; as?: "div" | "section" | "li" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  if (reduce) return <M className={className}>{children}</M>;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 12) * 0.04 }}
    >
      {children}
    </M>
  );
}
