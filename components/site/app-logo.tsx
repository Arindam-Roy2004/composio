"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { faviconUrl } from "@/lib/format";

/** Provider logo from its favicon, with a lettermark fallback. */
export function AppLogo({ name, website, size = 32, className }: { name: string; website: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-raised", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {failed ? (
        <span className="font-mono text-muted-foreground" style={{ fontSize: size * 0.42 }}>
          {letter}
        </span>
      ) : (
        <Image
          src={faviconUrl(website, 64)}
          alt=""
          width={Math.round(size * 0.6)}
          height={Math.round(size * 0.6)}
          unoptimized
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
