import { describe, expect, it } from "vitest";
import { analyseProbe, extractVisibleFields } from "@/lib/agent/probe";
import { classifySource, pickOfficialDomain, registrableDomain } from "@/lib/agent/sources";

const ctx = { officialDomains: new Set(["linkedin.com"]), slug: "linkedin" };

describe("source classification", () => {
  it("registrableDomain", () => {
    expect(registrableDomain("developer.linkedin.com")).toBe("linkedin.com");
    expect(registrableDomain("api.example.co.uk")).toBe("example.co.uk");
  });

  it.each([
    ["https://developer.linkedin.com/product-catalog", "official_docs"],
    ["https://www.linkedin.com/legal/l/api-terms-of-use", "policy"],
    ["https://learn.microsoft.com/en-us/linkedin/shared/authentication", "official_docs"],
    ["https://stackoverflow.com/questions/1", "community"],
    ["https://www.reddit.com/r/x", "community"],
    ["https://randomblog.example/linkedin-oauth", "other"],
  ])("%s → %s", (url, kind) => expect(classifySource(url, ctx)).toBe(kind));

  it("treats the provider's own docs repo on GitHub as official, but not other repos", () => {
    const gh = { officialDomains: new Set(["github.com"]), slug: "github" };
    expect(classifySource("https://raw.githubusercontent.com/github/docs/main/content/apps/oauth-apps/x.md", gh)).toBe("official_docs");
    expect(classifySource("https://raw.githubusercontent.com/someone/docs/main/x.md", gh)).toBe("other");
    expect(classifySource("https://raw.githubusercontent.com/github/random-repo/main/x.md", gh)).toBe("other");
    expect(classifySource("https://gist.github.com/github/abc", gh)).toBe("community");
  });

  it("probed pages are console", () => expect(classifySource("https://x.test", { ...ctx, probed: true })).toBe("console"));
});

describe("pickOfficialDomain", () => {
  const hit = (url: string) => ({ title: "", url, snippet: "" });

  it("prefers the provider's developer domain", () => {
    expect(pickOfficialDomain([hit("https://stackoverflow.com/q/zoom"), hit("https://developers.zoom.us/docs/oauth"), hit("https://medium.com/zoom")], "zoom")).toBe("zoom.us");
  });

  it("returns null when nothing is credible", () => {
    expect(pickOfficialDomain([hit("https://medium.com/x"), hit("https://randomsite.test/a")], "obscureapp")).toBeNull();
  });

  it("trusts a domain the user typed", () => expect(pickOfficialDomain([], "zoom", "zoom.us")).toBe("zoom.us"));

  it("finds a product that lives under its parent brand's domain", () => {
    const hits = [
      { title: "Sign in with ChatGPT | OpenAI Platform", url: "https://platform.openai.com/docs/guides/sign-in", snippet: "" },
      { title: "ChatGPT apps developer guide", url: "https://developers.openai.com/apps-sdk", snippet: "" },
    ];
    expect(pickOfficialDomain(hits, "chatgpt", undefined, "ChatGPT")).toBe("openai.com");
  });

  it("counts an official docs page whose snippet names the app", () => {
    const hits = [{ title: "Authentication – Plugins | OpenAI Developers", url: "https://developers.openai.com/plugins/build/auth", snippet: "ChatGPT can register dynamically…" }];
    expect(pickOfficialDomain(hits, "chatgpt", undefined, "chatgpt")).toBe("openai.com");
  });

  it("does not crown a single third-party tutorial", () => {
    const hits = [{ title: "ChatGPT API tutorial", url: "https://randomblog.example/chatgpt-api", snippet: "" }];
    expect(pickOfficialDomain(hits, "chatgpt", undefined, "ChatGPT")).toBeNull();
  });
});

describe("probe analysis", () => {
  it("detects a redirect to a login provider", () => {
    const o = analyseProbe({ url: "https://console.cloud.google.com/apis/credentials", finalUrl: "https://accounts.google.com/v3/signin/identifier", html: "", markdown: "Sign in" });
    expect(o).toMatchObject({ requiresLogin: true, loginProvider: "Google" });
  });

  it("detects a password field", () => {
    expect(analyseProbe({ url: "https://a.test/apps", finalUrl: "https://a.test/apps", html: '<input type="password" name="pw">', markdown: "x".repeat(5000) }).requiresLogin).toBe(true);
  });

  it("reports a reachable public form and its fields", () => {
    const html = '<form><label>App name</label><input name="app_name"><input type="hidden" name="csrf"><textarea placeholder="Description"></textarea></form>';
    const o = analyseProbe({ url: "https://a.test/new", finalUrl: "https://a.test/new", html, markdown: "x".repeat(5000) });
    expect(o.requiresLogin).toBe(false);
    expect(o.visibleFields).toEqual(["App name", "app_name", "Description"]);
  });

  it("caps field extraction", () => {
    expect(extractVisibleFields(Array.from({ length: 50 }, (_, i) => `<input name="f${i}">`).join(""), 5)).toHaveLength(5);
  });
});
