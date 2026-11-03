import { expect, test } from "@playwright/test";

// Marquees and reveals are motion-only; reduced motion makes elements stable to click.
test.use({ reducedMotion: "reduce" });

test("home → library card → guide → roadmap renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("OAuth app");
  await page.locator("#library").getByRole("link", { name: /GitHub/ }).first().click();
  await expect(page).toHaveURL(/\/guide\/github$/);
  await expect(page.getByRole("heading", { level: 1, name: "GitHub" })).toBeVisible();
  const roadmap = page.getByRole("figure", { name: "Setup roadmap by owner" });
  await expect(roadmap.locator(".react-flow__node-step")).toHaveCount(7);
  await expect(page.locator("#sources a[id^=source-]")).not.toHaveCount(0);
  await page.getByRole("tab", { name: "Markdown" }).click();
  await expect(page.locator("pre")).toContainText("# GitHub: OAuth app setup");
});

test("unknown guide returns 404 with a generate CTA", async ({ page }) => {
  const res = await page.goto("/guide/definitely-not-a-guide");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("link", { name: /Generate this guide/ })).toBeVisible();
});

test("live run renders streamed agent events (mocked stream)", async ({ page }) => {
  const events = [
    { type: "stage", stage: "resolve", status: "start" },
    { type: "stage", stage: "resolve", status: "done", slug: "github" },
    { type: "stage", stage: "identify", status: "start" },
    { type: "budget", toolCalls: 1, maxToolCalls: 10, pagesRead: 0, maxPages: 6 },
    { type: "search", query: "Acme developer OAuth app create register", results: 5 },
    { type: "stage", stage: "identify", status: "done" },
    { type: "stage", stage: "research", status: "start" },
    { type: "read", url: "https://docs.acme.test/oauth", title: "OAuth apps", domain: "docs.acme.test" },
    { type: "finding", claim: "Apps are created in the developer console", sourceUrl: "https://docs.acme.test/oauth" },
  ];
  const body = events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
  await page.route("**/api/generate", (route) => route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body }));
  await page.goto("/");
  await page.getByLabel("App name or website").fill("Acme");
  await page.getByRole("button", { name: "Generate guide" }).click();
  await expect(page.getByRole("list", { name: "Agent stages" })).toContainText("Research");
  const timeline = page.getByRole("list", { name: "Agent activity" });
  await expect(timeline).toContainText("OAuth apps"); // source chip for the page read
  await expect(timeline).toContainText("Apps are created in the developer console");
});

test("all guides page searches and offers research on no match", async ({ page }) => {
  await page.goto("/guides");
  await expect(page.getByRole("heading", { level: 1, name: "Guides" })).toBeVisible();
  await page.getByPlaceholder("Search guides").fill("notion");
  await expect(page.getByRole("link", { name: /Notion/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveCount(0);
  await page.getByPlaceholder("Search guides").fill("zzz-not-an-app");
  await expect(page.getByRole("link", { name: /Research “zzz-not-an-app”/ })).toBeVisible();
});

test("guides directory pages through large result sets", async ({ page }) => {
  const total = 60;
  const mk = (i: number) => ({
    slug: `app-${i}`,
    appName: `App ${String(i).padStart(2, "0")}`,
    website: `https://app${i}.example.com`,
    category: "Test",
    generatedBy: "agent",
    generatedAt: "2026-11-03T00:00:00.000Z",
    oauthSupport: "oauth2",
    difficulty: "moderate",
    oneLiner: "A generated guide used to test pagination.",
    activeSetup: { minMinutes: 10, maxMinutes: 20 },
    approval: "no",
    approvalDays: { minDays: 0, maxDays: 0 },
  });
  await page.route("**/api/guides/search?*", (route) => {
    const offset = Number(new URL(route.request().url()).searchParams.get("offset") ?? 0);
    const items = Array.from({ length: Math.min(24, total - offset) }, (_, i) => mk(offset + i));
    const next = offset + items.length < total ? offset + items.length : null;
    return route.fulfill({
      json: { success: true, data: { items, total, nextOffset: next, facets: { source: { all: total, library: 0, agent: total }, difficulty: { easy: 0, moderate: total, hard: 0, gated: 0, unknown: 0 } } } },
    });
  });
  await page.goto("/guides");
  await page.getByRole("button", { name: /^Moderate/ }).click(); // a filter change fetches page 1 from the API
  await expect(page.getByText("60 guides")).toBeVisible();
  await expect(page.locator("main ul li a[href^='/guide/app-']")).toHaveCount(24);
  await expect(page.getByText("Showing 24 of 60")).toBeVisible();
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.locator("main ul li a[href^='/guide/app-']")).toHaveCount(48, { timeout: 10_000 });
  await page.mouse.wheel(0, 20_000); // infinite scroll loads the last page
  await expect(page.locator("main ul li a[href^='/guide/app-']")).toHaveCount(60, { timeout: 10_000 });
});
