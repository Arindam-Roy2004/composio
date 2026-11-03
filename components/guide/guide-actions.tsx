"use client";

import { ArrowsClockwise, CaretDown, Check, Copy, FileMd, LinkSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { guideToMarkdown } from "@/lib/guide/markdown";
import type { Guide } from "@/lib/schema/guide.schema";

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
    return true;
  } catch {
    toast.error("Couldn’t access the clipboard");
    return false;
  }
}

/** "Copy page" split button, like a docs page: primary copies Markdown, menu has the rest. */
export function CopyPageButton({ guide }: { guide: Guide }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const md = () => guideToMarkdown(guide, window.location.origin);

  return (
    <div className="inline-flex rounded-lg shadow-card ring-1 ring-border">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-r-none rounded-l-lg px-3 text-[13px]"
        onClick={async () => {
          if (await copy(md(), "Guide as Markdown")) {
            setDone(true);
            setTimeout(() => setDone(false), 1400);
          }
        }}
      >
        {done ? <Check size={14} weight="bold" className="text-ev-tested" /> : <Copy size={14} />}
        Copy page
      </Button>
      <span className="w-px bg-border" aria-hidden />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-l-none rounded-r-lg p-0" aria-label="More page actions">
            <CaretDown size={13} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={() => copy(window.location.href, "Link")}>
            <LinkSimple /> <span>Copy link</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => copy(md(), "Guide as Markdown")}>
            <FileMd /> <span>Copy as Markdown</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => copy(guide.slug, "Slug")}>
            <Copy /> <span className="flex-1">Copy slug</span>
            <span className="font-mono text-[11px] text-subtle-foreground">{guide.slug}</span>
          </DropdownMenuItem>
          {guide.generatedBy !== "library" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push(`/?q=${encodeURIComponent(guide.appName)}&refresh=1#generate`)}>
                <ArrowsClockwise /> <span>Regenerate (rate-limited)</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
