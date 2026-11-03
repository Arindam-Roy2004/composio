import { z } from "zod";
import { analyseProbe, type ProbeObservation } from "@/lib/agent/probe";
import { BUDGET, normUrl, type AgentDeps, type RunState } from "@/lib/agent/state";
import { log } from "@/lib/log";

export const ProbeInput = z.object({ url: z.url({ protocol: /^https$/ }).max(2000) });

/**
 * Phase 3. Fetches a console URL and records only what is observable. Never signs in, never
 * submits forms, never creates accounts: context.dev renders the page and we read the result.
 * Called by the pipeline (not offered to the model) so probing always happens and stays bounded.
 */
export async function probeConsole(state: RunState, deps: AgentDeps, rawUrl: string, signal?: AbortSignal): Promise<ProbeObservation | { error: string }> {
  const parsed = ProbeInput.safeParse({ url: rawUrl });
  if (!parsed.success) return { error: "Invalid console URL" };
  const { url } = parsed.data;
  try {
    await deps.assertSafeUrl(url);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "URL not allowed" };
  }
  const over = state.take("probe");
  if (over) return { error: over };

  let obs: ProbeObservation;
  try {
    const s = signal ? AbortSignal.any([signal, AbortSignal.timeout(BUDGET.probeTimeoutMs)]) : AbortSignal.timeout(BUDGET.probeTimeoutMs);
    // Fresh fetch (maxAgeMs is handled by the scrape dep): login walls change.
    const page = await deps.scrape(url, { html: true, timeoutMs: BUDGET.probeTimeoutMs, signal: s });
    obs = analyseProbe({ url, finalUrl: page.finalUrl, html: page.html, markdown: page.markdown });
    state.addSource(page, url, { probed: true });
  } catch (err) {
    log.warn("probeConsole failed", { error: err instanceof Error ? err.message : String(err) });
    obs = { url, finalUrl: url, reachable: false, requiresLogin: false, visibleFields: [] };
  }
  if (obs.reachable) state.probedUrls.add(normUrl(url));
  state.probes.push(obs);
  state.emit({ type: "probe", url, requiresLogin: obs.requiresLogin });
  return obs;
}
