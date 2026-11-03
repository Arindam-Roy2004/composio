import "server-only";
import { z } from "zod";

// Empty strings in .env files count as missing.
const str = () => z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CONTEXT_DEV_API_KEY: str(),
  TAVILY_API_KEY: str(),
  UPSTASH_REDIS_REST_URL: z.preprocess((v) => (v === "" ? undefined : v), z.url().optional()),
  UPSTASH_REDIS_REST_TOKEN: str(),
  LLM_PROVIDER: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["openrouter", "anthropic"]).default("openrouter")),
  LLM_MODEL: str(),
  OPENROUTER_API_KEY: str(),
  ANTHROPIC_API_KEY: str(),
  IP_HASH_SALT: str(),
});

export type Env = z.infer<typeof EnvSchema>;

export type Feature = "redis" | "agent" | "scrape";

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const r = EnvSchema.safeParse(process.env);
  if (!r.success) {
    // Only variable names are reported, never values.
    const names = r.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment variables: ${names}`);
  }
  cached = r.data;
  return cached;
}

/** Names of variables missing for a feature. */
export function missingFor(feature: Feature, e: Env = env()): string[] {
  const need: string[] = [];
  if (feature === "redis" || feature === "agent") {
    if (!e.UPSTASH_REDIS_REST_URL) need.push("UPSTASH_REDIS_REST_URL");
    if (!e.UPSTASH_REDIS_REST_TOKEN) need.push("UPSTASH_REDIS_REST_TOKEN");
  }
  if (feature === "agent") {
    if (!e.TAVILY_API_KEY) need.push("TAVILY_API_KEY");
    if (!e.CONTEXT_DEV_API_KEY) need.push("CONTEXT_DEV_API_KEY");
    if (!e.LLM_MODEL) need.push("LLM_MODEL");
    if (e.LLM_PROVIDER === "openrouter" && !e.OPENROUTER_API_KEY) need.push("OPENROUTER_API_KEY");
    if (e.LLM_PROVIDER === "anthropic" && !e.ANTHROPIC_API_KEY) need.push("ANTHROPIC_API_KEY");
  }
  if (feature === "scrape" && !e.CONTEXT_DEV_API_KEY) need.push("CONTEXT_DEV_API_KEY");
  return need;
}

export class ConfigError extends Error {
  constructor(readonly missing: string[]) {
    super(`Missing environment variables: ${missing.join(", ")}`);
    this.name = "ConfigError";
  }
}

export function requireFeature(feature: Feature): Env {
  const e = env();
  const missing = missingFor(feature, e);
  if (missing.length) throw new ConfigError(missing);
  return e;
}

/** Runs once at server start (instrumentation.ts). Fails fast in production, warns in dev. */
export function checkEnvAtStartup(): void {
  const e = env();
  const missing = [...new Set(missingFor("agent", e))];
  if (!missing.length) return;
  const msg = `[env] Missing environment variables: ${missing.join(", ")}`;
  if (e.NODE_ENV === "production") throw new Error(msg);
  console.warn(`${msg}. Library guides work; live generation is disabled until these are set.`);
}
