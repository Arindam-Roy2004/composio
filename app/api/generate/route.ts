import { aiSdkBrain, runAgent, SynthesisError } from "@/lib/agent/run";
import { liveDeps } from "@/lib/agent/deps";
import { getModel } from "@/lib/agent/model";
import { GenerateGuideDto, type GenerateGuideInput } from "@/lib/dto/generate-guide.dto";
import { requireFeature } from "@/lib/env";
import { RateLimitError } from "@/lib/http/errors";
import { route } from "@/lib/http/handler";
import { createSseResponse } from "@/lib/http/sse";
import { log } from "@/lib/log";
import { acquireRunLock, enforceRateLimit } from "@/lib/security/rateLimit";
import { getGuide, isLibrarySlug, saveGuide } from "@/lib/storage/guides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The run itself has a 120s deadline; this leaves headroom for persistence. Requires a Vercel plan
// that allows 300s functions (see README).
export const maxDuration = 300;

const guideUrl = (slug: string) => `/guide/${slug}`;

export const POST = route<GenerateGuideInput>({ body: GenerateGuideDto, rateLimit: "read" }, async ({ req, body, ipHash, requestId }) => {
  const { query, forceRefresh } = body;

  // Phase 0: cache. Library guides are human-reviewed and are never regenerated.
  const cached = (isLibrarySlug(query.slug) || !forceRefresh) && (await getGuide(query.slug));
  if (cached) {
    return createSseResponse(async (w) => {
      w.send({ type: "guide_ready", slug: cached.slug, url: guideUrl(cached.slug), cached: true });
    });
  }

  requireFeature("agent"); // 503 with a clear message when keys are missing
  await enforceRateLimit("generate", ipHash); // only real runs count against 5/hour
  const release = await acquireRunLock(ipHash);
  if (!release) throw new RateLimitError("A guide is already being generated from your connection. Wait for it to finish.", 30);

  const { model, id } = getModel();
  const deps = liveDeps();

  // The run is NOT tied to the client connection: if the browser disconnects, the guide is still
  // saved and the client recovers by polling GET /api/guides/:slug.
  return createSseResponse(
    async (w) => {
      try {
        w.send({ type: "stage", stage: "resolve", status: "start" });
        w.send({ type: "stage", stage: "resolve", status: "done", slug: query.slug });
        const result = await runAgent({ query, emit: (e) => w.send(e), deps, brain: aiSdkBrain(model, id) });

        w.send({ type: "stage", stage: "save", status: "start" });
        await saveGuide(result.guide);
        w.send({ type: "stage", stage: "save", status: "done" });
        log.info("guide generated", {
          requestId,
          slug: result.guide.slug,
          toolCalls: result.guide.agentRun?.toolCalls,
          durationMs: result.guide.agentRun?.durationMs,
          downgraded: result.downgraded,
        });
        w.send({ type: "guide_ready", slug: result.guide.slug, url: guideUrl(result.guide.slug), cached: false });
      } catch (err) {
        log.error("generation failed", { requestId, slug: query.slug, error: err instanceof Error ? err.message : String(err) });
        w.send({
          type: "error",
          message: err instanceof SynthesisError ? "The research didn't produce a valid guide. Try again." : "Generation failed. Try again in a minute.",
          retryable: true,
        });
      } finally {
        await release().catch(() => {});
      }
    },
    { signal: req.signal, headers: { "x-request-id": requestId } },
  );
});
