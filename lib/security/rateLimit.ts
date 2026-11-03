import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "@/lib/env";
import { RateLimitError } from "@/lib/http/errors";
import { log } from "@/lib/log";
import { getRedis } from "@/lib/storage/redis";

export type LimitKey = "generate" | "read";

const LIMITS: Record<LimitKey, { tokens: number; window: `${number} ${"s" | "m" | "h"}` }> = {
  generate: { tokens: 5, window: "1 h" },
  read: { tokens: 60, window: "1 m" },
};

const limiters = new Map<LimitKey, Ratelimit>();

/** IPs are never stored raw. */
export function hashIp(ip: string): string {
  const salt = env().IP_HASH_SALT ?? "oauth-navigator";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function limiter(key: LimitKey): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  let l = limiters.get(key);
  if (!l) {
    const { tokens, window } = LIMITS[key];
    l = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window), prefix: `rl:${key}` });
    limiters.set(key, l);
  }
  return l;
}

let warned = false;

export async function enforceRateLimit(key: LimitKey, ipHash: string): Promise<void> {
  const l = limiter(key);
  if (!l) {
    if (!warned) log.warn("rate limiting disabled: Redis not configured");
    warned = true;
    return;
  }
  const r = await l.limit(ipHash);
  if (!r.success) {
    const retryAfter = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
    throw new RateLimitError("Too many requests. Try again later.", retryAfter);
  }
}

const LOCK_TTL_S = 150; // a bit longer than the 120s run deadline

/** One concurrent generation per IP. Returns a release function, or null if a run is already active. */
export async function acquireRunLock(ipHash: string): Promise<(() => Promise<void>) | null> {
  const redis = getRedis();
  if (!redis) return async () => {};
  const key = `lock:generate:${ipHash}`;
  const token = randomUUID();
  const ok = await redis.set(key, token, { nx: true, ex: LOCK_TTL_S });
  if (ok !== "OK") return null;
  return async () => {
    // Compare-and-delete so an expired lock taken by a newer run isn't released by us.
    await redis.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
      [key],
      [token],
    );
  };
}
