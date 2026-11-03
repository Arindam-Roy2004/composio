import type { EvidenceLevel, Guide, GuideSummary } from "@/lib/schema/guide.schema";

const hours = (m: number) => `${+(m / 60).toFixed(1)} h`;

export function formatMinutes(min: number, max: number): string {
  if (max <= 0) return "Unknown";
  if (min === max || min <= 0) return max >= 60 ? hours(max) : `${max} min`;
  if (max < 60) return `${min}–${max} min`;
  if (min >= 60) return `${+(min / 60).toFixed(1)}–${hours(max)}`;
  return `${min} min–${hours(max)}`;
}

function formatDays(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  const lo = min ?? max!;
  const hi = max ?? min!;
  if (hi === 0) return "None";
  const unit = (d: number) => (d >= 14 ? `${Math.round(d / 7)} wk` : `${d} day${d === 1 ? "" : "s"}`);
  if (lo === hi) return unit(hi);
  if (hi < 14) return `${lo}–${hi} days`;
  if (lo >= 14) return `${Math.round(lo / 7)}–${Math.round(hi / 7)} wk`;
  return `${unit(lo)}–${unit(hi)}`;
}

export const APPROVAL_LABEL: Record<Guide["time"]["approvalWait"]["required"], string> = {
  no: "No review",
  for_some_scopes: "For some scopes",
  for_public_use: "For public use",
  always: "Always required",
  unknown: "Unknown",
};

export function formatApproval(a: { required: Guide["time"]["approvalWait"]["required"]; minDays: number | null; maxDays: number | null }): string {
  if (a.required === "no") return "None";
  const days = formatDays(a.minDays, a.maxDays);
  if (a.required === "unknown") return days ?? "Unknown";
  return days ?? "Timeline unpublished";
}

/** Compact variant for small stat tiles. */
export function formatApprovalShort(a: Parameters<typeof formatApproval>[0]): string {
  const full = formatApproval(a);
  return full === "Timeline unpublished" ? "Unpublished" : full;
}

export function summaryApproval(s: GuideSummary): string {
  if (s.approval === "no") return "no review";
  const d = formatDays(s.approvalDays.minDays, s.approvalDays.maxDays);
  return d ? `review ${d}` : `review ${APPROVAL_LABEL[s.approval].toLowerCase()}`;
}

export const EVIDENCE_META: Record<EvidenceLevel, { label: string; description: string }> = {
  tested: { label: "Tested", description: "A person actually did this and recorded the date." },
  probed: { label: "Probed", description: "Our agent reached the page or console and observed it, without signing in." },
  documented: { label: "Documented", description: "Stated in the provider's official docs or policy pages." },
  community: { label: "Community", description: "From a source we could not confirm is the provider’s own: a forum, blog, Q&A site or third-party docs." },
  uncertain: { label: "Uncertain", description: "Not confirmed. We say what is unknown and how to find out." },
};

export const DIFFICULTY_META: Record<Guide["verdict"]["difficulty"], { label: string; level: number; description: string }> = {
  easy: { label: "Easy", level: 1, description: "Keys in minutes, no review." },
  moderate: { label: "Moderate", level: 2, description: "Review only for public distribution or some scopes." },
  hard: { label: "Hard", level: 3, description: "Mandatory verification or security assessment." },
  gated: { label: "Gated", level: 4, description: "Partner programme or approval that may be refused." },
};

export const OWNER_META = {
  agent: { label: "Agent can do", short: "Agent" },
  human: { label: "You do", short: "You" },
  provider: { label: "Provider review", short: "Provider" },
} as const;

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Favicon via Google's service, keyed on the registrable domain (developers.notion.com → notion.com). */
export function faviconUrl(url: string, size = 64): string {
  const host = domainOf(url).toLowerCase();
  const labels = host.split(".");
  const twoPart = labels.length > 2 && labels[labels.length - 1]!.length === 2 && ["co", "com", "org", "net", "ac", "gov"].includes(labels[labels.length - 2]!);
  const reg = labels.slice(twoPart ? -3 : -2).join(".");
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(reg || host)}&sz=${size}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
