"use client";

import { MoonStars, Sun } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => setMounted(true), []);
  const dark = !mounted || resolvedTheme !== "light";

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle colour theme" onClick={() => setTheme(dark ? "light" : "dark")} className="size-8 rounded-lg">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "moon" : "sun"}
          initial={reduce ? false : { rotate: -60, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={reduce ? undefined : { rotate: 60, scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="flex"
        >
          {dark ? <MoonStars size={17} weight="duotone" /> : <Sun size={17} weight="duotone" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
