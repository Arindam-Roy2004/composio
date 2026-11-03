"use client";

import { useCallback, useState } from "react";
import { faviconUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Provider logo from its favicon, with a lettermark fallback.
 * Failure is detected with img.decode() rather than onError: an image that starts loading from
 * server-rendered HTML can fail before React attaches handlers, and that event is never replayed.
 */
export function AppLogo({ name, website, size = 32, className }: { name: string; website: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    let live = true;
    img
      .decode()
      .then(() => {
        // Google's service answers unknown domains with a 16px generic globe; treat that as missing.
        if (live && img.naturalWidth > 0 && img.naturalWidth < 20 && size > 20) setFailed(true);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [size]);

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised ring-1 ring-border", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {failed ? (
        <span className="font-semibold text-muted-foreground" style={{ fontSize: size * 0.42 }}>
          {letter}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- tiny external favicon; next/image adds nothing here
        <img
          ref={ref}
          src={faviconUrl(website, 64)}
          alt=""
          width={Math.round(size * 0.6)}
          height={Math.round(size * 0.6)}
          referrerPolicy="no-referrer"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
