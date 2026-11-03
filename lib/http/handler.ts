import "server-only";
import type { NextRequest } from "next/server";
import type { DtoClass } from "@/lib/dto/base.dto";
import { BadRequestError, PayloadTooLargeError, UnsupportedMediaTypeError, ValidationError } from "@/lib/http/errors";
import { requestIdOf, toErrorResponse } from "@/lib/http/errorResponse";
import { enforceRateLimit, hashIp, type LimitKey } from "@/lib/security/rateLimit";

export const MAX_BODY_BYTES = 8 * 1024;

export type RouteCtx<B, P> = { req: NextRequest; body: B; params: P; ip: string; ipHash: string; requestId: string };

type RouteOpts<B, P> = { body?: DtoClass<B>; params?: DtoClass<P>; rateLimit?: LimitKey };

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

async function readJsonBody(req: NextRequest): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) throw new UnsupportedMediaTypeError();
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) throw new PayloadTooLargeError();

  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new PayloadTooLargeError();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new BadRequestError("Body is not valid JSON");
  }
}

/** Route wrapper: body checks → rate limit → DTO validation → handler, with one error shape everywhere. */
export function route<B = undefined, P = undefined>(
  opts: RouteOpts<B, P>,
  fn: (ctx: RouteCtx<B, P>) => Promise<Response>,
) {
  return async (req: NextRequest, segment: { params: Promise<Record<string, string | string[]>> }) => {
    const requestId = requestIdOf(req);
    try {
      const ip = clientIp(req);
      const ipHash = hashIp(ip);
      if (opts.rateLimit) await enforceRateLimit(opts.rateLimit, ipHash);

      let body = undefined as B;
      if (opts.body) {
        const r = opts.body.validate(await readJsonBody(req));
        if (r.errors) throw new ValidationError("Validation failed", r.errors);
        body = r.value;
      }

      let params = undefined as P;
      if (opts.params) {
        const r = opts.params.validate((await segment?.params) ?? {});
        if (r.errors) throw new ValidationError("Invalid path", r.errors);
        params = r.value;
      }

      return await fn({ req, body, params, ip, ipHash, requestId });
    } catch (err) {
      return toErrorResponse(err, req, { requestId });
    }
  };
}
