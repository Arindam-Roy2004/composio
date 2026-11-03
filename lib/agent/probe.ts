// Observes a console page without interacting with it: no sign-in, no form submission.
import { hostOf } from "@/lib/agent/sources";

export type ProbeObservation = {
  url: string;
  finalUrl: string;
  reachable: boolean;
  requiresLogin: boolean;
  loginProvider?: string;
  visibleFields: string[];
};

const LOGIN_HOSTS: [RegExp, string][] = [
  [/(^|\.)accounts\.google\.com$/, "Google"],
  [/(^|\.)login\.microsoftonline\.com$|(^|\.)login\.live\.com$/, "Microsoft"],
  [/(^|\.)appleid\.apple\.com$/, "Apple"],
  [/(^|\.)auth0\.com$/, "Auth0"],
  [/(^|\.)okta\.com$/, "Okta"],
];

const LOGIN_PATH = /\/(login|log-in|signin|sign-in|sign_in|session|sessions|auth|authorize|sso|uas\/login)(\/|$|\?)/i;
const LOGIN_TEXT = /\b(sign in|log in|login to continue|sign in to continue|continue with google|forgot (your )?password)\b/i;

function textOf(fragment: string): string {
  return fragment.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[2] ?? m[3]) : undefined;
}

/** Labels of visible form inputs, from <label> text and input name/placeholder/aria-label. */
export function extractVisibleFields(html: string, limit = 20): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)) {
    const t = textOf(m[1]!);
    if (t && t.length <= 80) out.add(t);
  }
  for (const m of html.matchAll(/<(input|textarea|select)\b[^>]*>/gi)) {
    const tag = m[0];
    const type = (attr(tag, "type") ?? "text").toLowerCase();
    if (["hidden", "submit", "button", "image", "reset"].includes(type)) continue;
    const label = attr(tag, "aria-label") ?? attr(tag, "placeholder") ?? attr(tag, "name") ?? attr(tag, "id");
    if (label && label.length <= 80) out.add(type === "password" ? `${label} (password)` : label);
  }
  return [...out].slice(0, limit);
}

export function analyseProbe(input: { url: string; finalUrl: string; html: string | null; markdown: string }): ProbeObservation {
  const finalHost = hostOf(input.finalUrl);
  const startHost = hostOf(input.url);
  const html = input.html ?? "";
  const provider = LOGIN_HOSTS.find(([re]) => re.test(finalHost))?.[1];

  let finalPath = "";
  try {
    finalPath = new URL(input.finalUrl).pathname + new URL(input.finalUrl).search;
  } catch {
    /* keep empty */
  }

  const hasPassword = /<input\b[^>]*type\s*=\s*["']?password/i.test(html);
  const redirectedToLogin = LOGIN_PATH.test(finalPath) || Boolean(provider);
  const loginCopy = LOGIN_TEXT.test(input.markdown.slice(0, 4000));
  const requiresLogin = redirectedToLogin || hasPassword || (loginCopy && input.markdown.length < 3000);

  return {
    url: input.url,
    finalUrl: input.finalUrl,
    reachable: true,
    requiresLogin,
    loginProvider: requiresLogin ? (provider ?? (finalHost !== startHost ? finalHost : undefined)) : undefined,
    visibleFields: extractVisibleFields(html),
  };
}
