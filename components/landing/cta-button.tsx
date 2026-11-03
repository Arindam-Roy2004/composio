"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function CtaButton() {
  return (
    <Button
      className="mt-7 h-10 rounded-xl bg-brand px-4 text-brand-foreground hover:bg-brand/90"
      onClick={() => {
        const input = document.getElementById("generate-input") as HTMLInputElement | null;
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => input?.focus({ preventScroll: true }), 400);
      }}
    >
      Research an app <ArrowRight size={15} />
    </Button>
  );
}
