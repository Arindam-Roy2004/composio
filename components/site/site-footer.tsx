import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-tight">OAuth Navigator</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Research aids, not legal advice. Provider policies change, so every guide shows when it was researched and verified.
          </p>
        </div>
        <nav aria-label="Product" className="text-sm">
          <p className="font-medium">Product</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link href="/#library" className="hover:text-foreground">Library</Link></li>
            <li><Link href="/#generate" className="hover:text-foreground">Research an app</Link></li>
            <li><Link href="/#how" className="hover:text-foreground">How it works</Link></li>
          </ul>
        </nav>
        <nav aria-label="Method" className="text-sm">
          <p className="font-medium">Method</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link href="/#evidence" className="hover:text-foreground">Evidence labels</Link></li>
            <li><Link href="/guide/github" className="hover:text-foreground">Example guide</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
