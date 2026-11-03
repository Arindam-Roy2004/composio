"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Sticky table of contents that highlights the section in view. */
export function Toc({ items }: { items: readonly (readonly [string, string])[] }) {
  const [active, setActive] = useState(items[0]?.[0]);
  useEffect(() => {
    const els = items.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <ul className="space-y-0.5 text-[13px]">
      {items.map(([id, label]) => (
        <li key={id}>
          <a
            href={`#${id}`}
            aria-current={active === id ? "location" : undefined}
            className={cn(
              "relative block rounded-md py-1 pl-3 transition-colors",
              active === id ? "text-foreground" : "text-subtle-foreground hover:text-foreground",
            )}
          >
            <span className={cn("absolute top-1/2 left-0 h-3.5 w-0.5 -translate-y-1/2 rounded-full transition-all duration-300", active === id ? "bg-brand" : "bg-transparent")} />
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}
