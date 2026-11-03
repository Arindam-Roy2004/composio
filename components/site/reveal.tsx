"use client";

import { motion, useReducedMotion } from "motion/react";

/** Blur-in fade-up on mount (or when scrolled into view), 60ms stagger. Disabled under reduced motion. */
export function Reveal({ children, index = 0, className, inView = false }: { children: React.ReactNode; index?: number; className?: string; inView?: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const to = { opacity: 1, y: 0, filter: "blur(0px)" };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
      {...(inView ? { whileInView: to, viewport: { once: true, margin: "-60px" } } : { animate: to })}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 10) * 0.06 }}
    >
      {children}
    </motion.div>
  );
}
