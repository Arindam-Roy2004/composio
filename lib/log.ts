// Structured server logging. Every line is redacted of known secret values as a last line of defence.
const SECRET_VARS = [
  "CONTEXT_DEV_API_KEY",
  "TAVILY_API_KEY",
  "UPSTASH_REDIS_REST_TOKEN",
  "OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY",
  "IP_HASH_SALT",
];

export function redact(text: string): string {
  let out = text;
  for (const name of SECRET_VARS) {
    const value = process.env[name];
    if (value && value.length >= 8) out = out.split(value).join(`[${name}]`);
  }
  return out.replace(/\b(ctxt_secret_|tvly-|sk-or-|sk-ant-)[A-Za-z0-9_-]+/g, "$1[redacted]");
}

type Level = "info" | "warn" | "error";

function write(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  const line = redact(JSON.stringify({ level, msg, ...fields, ts: new Date().toISOString() }));
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (msg: string, fields?: Record<string, unknown>) => write("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => write("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => write("error", msg, fields),
};
