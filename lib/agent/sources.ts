import type { Source } from "@/lib/schema/guide.schema";

const SECOND_LEVEL_SUFFIXES = new Set(["co", "com", "org", "net", "gov", "ac", "edu", "ne", "or"]);

const COMMUNITY_HOSTS = [
  "stackoverflow.com", "stackexchange.com", "reddit.com", "medium.com", "dev.to", "hashnode.dev",
  "news.ycombinator.com", "quora.com", "substack.com", "youtube.com", "community.", "forum.", "forums.",
  "discuss.", "gist.github.com",
];

const DOCS_HOST_PREFIX = /^(docs|developer|developers|dev|api|learn|support|help)\./;

export function registrableDomain(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/\.$/, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const sld = labels[labels.length - 2]!;
  const tld = labels[labels.length - 1]!;
  const take = tld.length === 2 && SECOND_LEVEL_SUFFIXES.has(sld) ? 3 : 2;
  return labels.slice(-take).join(".");
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isCommunity(host: string, path: string): boolean {
  if (COMMUNITY_HOSTS.some((h) => (h.endsWith(".") ? host.startsWith(h) : host === h || host.endsWith(`.${h}`)))) return true;
  return /\/(community|forum|forums|discussions|questions)\//.test(path);
}

/**
 * Deterministic source classification. The model never decides whether a page is "official":
 * that is what makes the verifier's "documented requires an official source" rule meaningful.
 */
export function classifySource(url: string, ctx: { officialDomains: Set<string>; slug: string; probed?: boolean }): Source["kind"] {
  if (ctx.probed) return "console";
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "other";
  }
  const host = u.hostname.toLowerCase();
  const path = u.pathname.toLowerCase();
  if (isCommunity(host, path)) return "community";

  const official =
    ctx.officialDomains.has(registrableDomain(host)) ||
    // Docs hosted on a parent company's docs site, e.g. learn.microsoft.com/linkedin/...
    (DOCS_HOST_PREFIX.test(host) && ctx.slug.length >= 3 && (path.includes(`/${ctx.slug}`) || host.includes(ctx.slug)));
  if (!official) return "other";
  if (/\/(policy|policies|terms|legal|privacy|tos|developer-policy|guidelines|requirements)(\/|$|-)/.test(path)) return "policy";
  return "official_docs";
}

export type SearchHit = { title: string; url: string; snippet: string };

/**
 * Phase 1: pick the provider's official developer domain from search results.
 * Returns null when nothing is credible, so the run can stop early instead of guessing.
 */
export function pickOfficialDomain(hits: SearchHit[], slug: string, userDomain?: string, appName?: string): string | null {
  if (userDomain) return registrableDomain(userDomain);
  const scores = new Map<string, number>();
  const core = slug.split("-")[0] ?? slug;
  for (const h of hits) {
    const host = hostOf(h.url);
    if (!host) continue;
    const path = new URL(h.url).pathname.toLowerCase();
    if (isCommunity(host, path)) continue;
    const reg = registrableDomain(host);
    const label = reg.split(".")[0]!;
    let s = 0;
    if (label === slug.replace(/-/g, "") || label === core) s += 4;
    else if (core.length >= 4 && (label.includes(core) || core.includes(label))) s += 2;
    if (DOCS_HOST_PREFIX.test(host)) s += 2;
    if (/oauth|auth|apps?\b|developer|api/.test(path)) s += 1;
    // Products under a parent brand (ChatGPT on openai.com, Instagram on facebook.com):
    // an official-looking docs page whose title names the app counts.
    const brand = (appName ?? slug).toLowerCase();
    if (brand.length >= 3 && DOCS_HOST_PREFIX.test(host) && `${h.title} ${h.snippet}`.toLowerCase().includes(brand)) s += 3;
    else if (brand.length >= 3 && h.title.toLowerCase().includes(brand) && /oauth|developer|api|docs/.test(path + h.title.toLowerCase())) s += 2;
    scores.set(reg, (scores.get(reg) ?? 0) + s);
  }
  let best: [string, number] | null = null;
  for (const entry of scores) if (!best || entry[1] > best[1]) best = entry;
  return best && best[1] >= 4 ? best[0] : null;
}
