import net from "node:net";
import { assertSafeUrlSync } from "@/lib/security/urlGuard";
import { AppError } from "@/lib/http/errors";

export type SanitizedQuery = {
  display: string;
  slug: string;
  kind: "name" | "domain";
  domain?: string;
};

export const QUERY_MAX = 120;

// C0/C1 control characters, zero-width and invisible formatting characters.
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁤﻿]/g;
// Letters, digits, space, and . - _ / : & + ' ( )
const ALLOWED = /^[\p{L}\p{N} .\-_/:&+'()]+$/u;
const LOOKS_LIKE_URL = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;
const SECOND_LEVEL_SUFFIXES = new Set(["co", "com", "org", "net", "gov", "ac", "edu", "ne", "or"]);

/** Thrown for user input we refuse. DTOs turn it into a field-level 422. */
export class QueryRejectedError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

export function toSlug(input: string, max = 64): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

/** zoom.us → zoom, developer.zoom.us → zoom, www.example.co.uk → example */
export function domainToSlug(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/^www\./, "").split(".").filter(Boolean);
  if (labels.length >= 3) {
    const sld = labels[labels.length - 2]!;
    const tld = labels[labels.length - 1]!;
    if (tld.length === 2 && SECOND_LEVEL_SUFFIXES.has(sld)) labels.splice(-2, 2);
    else labels.pop();
  } else if (labels.length > 1) {
    labels.pop();
  }
  return toSlug(labels[labels.length - 1] ?? "");
}

/**
 * Normalises a user query ("Zoom", "https://zoom.us/docs") into an identity.
 * Rejects (never silently mangles) anything outside the allowlist.
 * DNS-level SSRF checks happen later, on every URL the agent actually fetches.
 */
export function sanitizeQuery(raw: unknown): SanitizedQuery {
  const cleaned = String(raw ?? "")
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 2) throw new QueryRejectedError("Enter an app name or website");
  if (cleaned.length > QUERY_MAX) throw new QueryRejectedError(`Keep it under ${QUERY_MAX} characters`);
  if (!ALLOWED.test(cleaned)) {
    throw new QueryRejectedError("Use letters, numbers, spaces and . - _ / : & + ' ( ) only");
  }

  const hostPart = cleaned.replace(/^[a-z]+:\/\//i, "").split("/")[0]!.replace(/^\[|\]$/g, "");
  if (net.isIP(hostPart) || /^\d+(\.\d+){3}(:\d+)?$/.test(hostPart)) {
    throw new QueryRejectedError("IP addresses are not allowed. Enter an app name or website");
  }

  if (LOOKS_LIKE_URL.test(cleaned) && !cleaned.includes(" ")) {
    const withScheme = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    let url: URL;
    try {
      url = assertSafeUrlSync(withScheme);
    } catch (err) {
      throw new QueryRejectedError(err instanceof Error ? err.message : "Invalid URL");
    }
    const domain = url.hostname.toLowerCase().replace(/^www\./, "");
    const slug = domainToSlug(domain);
    if (!slug) throw new QueryRejectedError("Could not derive a name from that website");
    return { display: domain, slug, kind: "domain", domain };
  }

  // Not a URL: still refuse URL-ish input that failed the pattern (e.g. "http://169.254.169.254").
  if (/^[a-z]+:\/\//i.test(cleaned)) {
    try {
      assertSafeUrlSync(cleaned);
    } catch (err) {
      throw new QueryRejectedError(err instanceof Error ? err.message : "Invalid URL");
    }
    throw new QueryRejectedError("Enter an app name or a public website");
  }

  const slug = toSlug(cleaned);
  if (!slug) throw new QueryRejectedError("Enter a name using Latin letters or digits, or a website");
  return { display: cleaned, slug, kind: "name" };
}
