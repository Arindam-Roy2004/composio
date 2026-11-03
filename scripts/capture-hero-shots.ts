// Captures real screenshots of our own guide pages for the landing-page 3D marquee.
// Usage: pnpm dev (in another terminal), then: pnpm capture:hero
// Output: public/hero/{dark,light}/NN.jpg at 970x700 (the marquee's aspect ratio).
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const SLUGS = ["github", "notion", "slack", "gmail", "linkedin"];
const SECTIONS = ["top", "roadmap", "steps", "scopes"] as const;
const W = 970;
const H = 700;

const HIDE = `
  header.sticky, body footer, nextjs-portal, [data-nextjs-toast], aside { display: none !important; }
  main > div { grid-template-columns: minmax(0, 1fr) !important; max-width: 1000px !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
`;

async function run() {
  const browser = await chromium.launch();
  for (const theme of ["dark", "light"] as const) {
    const dir = join(process.cwd(), "public/hero", theme);
    mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await ctx.addInitScript((t) => localStorage.setItem("theme", t), theme);
    const page = await ctx.newPage();
    let n = 0;
    for (const section of SECTIONS) {
      for (const slug of SLUGS) {
        await page.goto(`${BASE}/guide/${slug}`, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: HIDE });
        await page.waitForTimeout(400);
        let y = 0;
        if (section !== "top") {
          y = await page.evaluate((id) => {
            const el = document.getElementById(id);
            return el ? el.getBoundingClientRect().top + window.scrollY - 24 : 0;
          }, section);
        }
        const x = await page.evaluate(() => {
          const main = document.querySelector("main article") as HTMLElement | null;
          return main ? Math.max(0, main.getBoundingClientRect().left) : 0;
        });
        n++;
        await page.screenshot({
          path: join(dir, `${String(n).padStart(2, "0")}.jpg`),
          type: "jpeg",
          quality: 72,
          fullPage: true,
          clip: { x, y, width: W, height: H },
        });
      }
    }
    await ctx.close();
    console.log(`captured ${n} ${theme} shots`);
  }
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
