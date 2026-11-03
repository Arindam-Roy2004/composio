"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Animates the numbers inside a label like "5–15 min" from 0. Static under reduced motion. */
export function CountUp({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(reduce ? 1 : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, 1, { duration: 0.6, ease: [0.22, 1, 0.36, 1], onUpdate: setProgress });
    return () => c.stop();
  }, [inView, reduce]);

  const shown = progress >= 1 ? text : text.replace(/\d+(\.\d+)?/g, (n) => String(Math.round(Number(n) * progress)));
  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}
