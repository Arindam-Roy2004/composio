import { z } from "zod";

export const STAGES = ["resolve", "identify", "research", "probe", "synthesise", "verify", "save"] as const;
export type Stage = (typeof STAGES)[number];

const short = (max: number) => z.string().max(max);

export const AgentEventSchema = z.discriminatedUnion("type", [
  // slug is sent on resolve so a client whose stream drops can poll GET /api/guides/:slug.
  z.object({ type: z.literal("stage"), stage: z.enum(STAGES), status: z.enum(["start", "done"]), slug: z.string().max(64).optional() }),
  z.object({ type: z.literal("search"), query: short(200), results: z.number().int().min(0) }),
  z.object({ type: z.literal("read"), url: z.url(), title: short(200), domain: short(253) }),
  z.object({ type: z.literal("finding"), claim: short(300), sourceUrl: z.url() }),
  z.object({ type: z.literal("probe"), url: z.url(), requiresLogin: z.boolean() }),
  // Addition to the brief's union: lets the UI show "budget used: 6/10 tool calls".
  z.object({
    type: z.literal("budget"),
    toolCalls: z.number().int(),
    maxToolCalls: z.number().int(),
    pagesRead: z.number().int(),
    maxPages: z.number().int(),
  }),
  z.object({ type: z.literal("verification"), downgraded: z.number().int().min(0), notes: z.array(short(300)).max(50) }),
  z.object({ type: z.literal("guide_ready"), slug: z.string().max(64), url: z.string().max(100), cached: z.boolean() }),
  z.object({ type: z.literal("error"), message: short(300), retryable: z.boolean() }),
]);

export type AgentEvent = z.infer<typeof AgentEventSchema>;
export type AgentEventOf<T extends AgentEvent["type"]> = Extract<AgentEvent, { type: T }>;
