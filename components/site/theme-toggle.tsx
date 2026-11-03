"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "light" ? "dark" : "light";
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle colour theme" onClick={() => setTheme(next)} className="size-8">
      <Sun className="size-4 dark:hidden" strokeWidth={1.5} />
      <Moon className="hidden size-4 dark:block" strokeWidth={1.5} />
    </Button>
  );
}
