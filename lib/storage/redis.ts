import "server-only";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let client: Redis | null | undefined;

/** Returns null when Upstash isn't configured (library-only mode in local dev). */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const e = env();
  client =
    e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN
      ? new Redis({ url: e.UPSTASH_REDIS_REST_URL, token: e.UPSTASH_REDIS_REST_TOKEN })
      : null;
  return client;
}
