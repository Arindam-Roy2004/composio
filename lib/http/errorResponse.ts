// Central error → Response mapping. Ported from Sagewell backend/src/middlewares/error.middlewares.js.
import { AppError, RateLimitError } from "@/lib/http/errors";
import { log } from "@/lib/log";

export type ErrorBody = { success: false; message: string; details?: unknown; requestId?: string };

export function requestIdOf(req?: Request): string {
  return req?.headers.get("x-vercel-id") ?? req?.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function toErrorResponse(
  err: unknown,
  req?: Request,
  opts: { production?: boolean; requestId?: string } = {},
): Response {
  const production = opts.production ?? process.env.NODE_ENV === "production";
  const requestId = opts.requestId ?? requestIdOf(req);
  const path = req ? new URL(req.url).pathname : undefined;

  let status = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof Error && err.name === "ConfigError") {
    status = 503;
    message = "This server is not configured for live generation yet.";
  }

  if (status >= 500) {
    log.error(message, {
      requestId,
      path,
      status,
      error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
    });
  } else {
    log.warn(message, { requestId, path, status });
  }

  if (production && status >= 500) {
    message = status === 503 ? message : "Internal server error";
    details = undefined;
  }

  const body: ErrorBody = { success: false, message, ...(details !== undefined ? { details } : {}), requestId };
  const headers = new Headers({ "content-type": "application/json", "x-request-id": requestId });
  if (err instanceof RateLimitError) headers.set("retry-after", String(err.retryAfter));
  return new Response(JSON.stringify(body), { status, headers });
}

export function ok<T>(data: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify({ success: true, data }), { ...init, headers });
}
