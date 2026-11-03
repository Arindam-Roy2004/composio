"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Full-bleed tilted wall of product screenshots. Adapted from Aceternity UI's 3D Marquee
 * (components/ui/3d-marquee.tsx): same rotated plane and alternating column drift, but the plane
 * is centred on its container so it fills a hero of any size.
 */
export function TiltedShots({ images, columns = 6 }: { images: string[]; columns?: number }) {
  const reduce = useReducedMotion();
  const cols = Array.from({ length: columns }, (_, c) => {
    const col = images.filter((_, i) => i % columns === c);
    return [...col, ...images.slice(c, c + 2)]; // pad so every column is tall enough
  });

  return (
    <div className="absolute inset-0 overflow-hidden [perspective:2000px]">
      <div
        className="absolute top-1/2 left-1/2 grid w-[2700px] grid-cols-6 gap-7 transform-3d"
        style={{ transform: "translate(-50%, -46%) rotateX(52deg) rotateZ(-38deg)", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cols.map((col, c) => (
          <motion.div
            key={c}
            className="relative flex flex-col gap-7"
            initial={false}
            animate={reduce ? undefined : { y: c % 2 === 0 ? [0, -140] : [-140, 0] }}
            transition={{ duration: 14 + c * 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          >
            <span className="absolute -left-3.5 -top-40 -bottom-40 w-px bg-[linear-gradient(to_bottom,var(--border-strong)_50%,transparent_0)] [background-size:1px_6px]" />
            {col.map((src, i) => (
              <div key={`${src}-${i}`} className="relative">
                <span className="absolute -top-3.5 -left-10 -right-10 h-px bg-[linear-gradient(to_right,var(--border-strong)_50%,transparent_0)] [background-size:6px_1px]" />
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative, pre-sized local assets */}
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  width={970}
                  height={700}
                  className="aspect-[970/700] w-full rounded-xl object-cover object-top shadow-[0_30px_80px_-30px_oklch(0_0_0/55%)] ring-1 ring-border-strong"
                />
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
