import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { requireFeature } from "@/lib/env";

export function getModel(): { model: LanguageModel; id: string } {
  const e = requireFeature("agent");
  const id = e.LLM_MODEL!;
  if (e.LLM_PROVIDER === "anthropic") {
    return { model: createAnthropic({ apiKey: e.ANTHROPIC_API_KEY })(id), id };
  }
  return { model: createOpenRouter({ apiKey: e.OPENROUTER_API_KEY }).chat(id), id };
}
