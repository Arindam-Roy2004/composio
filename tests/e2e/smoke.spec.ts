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
  const timeline = page.getByRole("list", { name: "Agent progress" });
  await expect(timeline).toContainText("Research");
  await expect(timeline).toContainText("OAuth apps"); // source chip for the page read
  await expect(timeline).toContainText("Apps are created in the developer console");
});
