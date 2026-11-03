// context.dev scrape wrapper. Ported from Sagewell backend/shared/libs/contextDev.js:
// same endpoint, bearer auth, request body and single-retry policy, with an injectable fetch for tests.
import { UpstreamError } from "@/lib/http/errors";

const BASE_URL = "https://api.context.dev/v1";
const MAX_ATTEMPTS = 2;
const MAX_RETRY_WAIT_MS = 10_000;
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type ScrapeResult = {
  markdown: string;
  html: string | null;
  title: string | null;
  finalUrl: string;
  isPartial: boolean;
  cacheStatus: string | null;
  requestId: string | null;
};

export type ScrapeOptions = {
  apiKey: string;
  html?: boolean;
  maxAgeMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

export class ContextDevError extends UpstreamError {
  constructor(message: string, readonly code: string, status?: number) {
    super("context.dev", message, status);
  }
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function retryDelayMs(res: Response): number {
  const header = Number(res.headers.get("retry-after"));
  return Number.isFinite(header) && header > 0 ? Math.min(header * 1000, MAX_RETRY_WAIT_MS) : 1000;
}

async function readJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

type Part = { data?: string | null; success?: boolean | null; error_code?: string } | undefined;

export async function scrapePage(url: string, opts: ScrapeOptions): Promise<ScrapeResult> {
  const { apiKey, maxAgeMs = SEVEN_DAYS_MS, timeoutMs = 45_000, fetchImpl = fetch, sleep = defaultSleep } = opts;
  if (!apiKey) throw new ContextDevError("Page reader is not configured", "NOT_CONFIGURED");

  const body = {
    url,
    formats: { markdown: true, html: Boolean(opts.html) },
    markdownParams: { includeLinks: true, includeImages: false },
    maxAgeMs,
    timeoutOpts: { milliseconds: timeoutMs, behavior: "fail" },
  };
  const signal = opts.signal
    ? AbortSignal.any([opts.signal, AbortSignal.timeout(timeoutMs + 5_000)])
    : AbortSignal.timeout(timeoutMs + 5_000);

  let res: Response | undefined;
  let payload: Record<string, unknown> | null = null;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetchImpl(`${BASE_URL}/web/scrape`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
    } catch {
      if (attempt < MAX_ATTEMPTS && !signal.aborted) {
        await sleep(1000);
        continue;
      }
      throw new ContextDevError(signal.aborted ? "Page read timed out" : "Could not reach the page reader", "NETWORK_ERROR");
    }
    payload = await readJson(res);
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < MAX_ATTEMPTS) {
      await sleep(retryDelayMs(res));
      continue;
    }
    break;
  }

  if (!res.ok) {
    const code = typeof payload?.error_code === "string" ? payload.error_code : `HTTP_${res.status}`;
    // Never forward the upstream body: it may echo request details.
    throw new ContextDevError(`Page reader failed (${code})`, code, res.status);
  }

  const md = payload?.markdown as Part;
  const html = payload?.html as Part;
  const markdown = typeof md?.data === "string" ? md.data : "";
  if (!markdown.trim()) throw new ContextDevError("Page had no readable content", md?.error_code ?? "EMPTY_RESULT", res.status);

  const meta = (payload?.metadata ?? {}) as { title?: string };
  const cache = (payload?.cache_metadata ?? {}) as { status?: string };
  return {
    markdown,
    html: typeof html?.data === "string" ? html.data : null,
    title: typeof meta.title === "string" ? meta.title : null,
    finalUrl: typeof payload?.url === "string" ? payload.url : url,
    isPartial: payload?.isPartial === true,
    cacheStatus: typeof cache.status === "string" ? cache.status : null,
    requestId: typeof payload?.request_id === "string" ? payload.request_id : null,
  };
}
