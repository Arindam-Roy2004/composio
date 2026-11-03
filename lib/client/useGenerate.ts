"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { parseSse } from "@/lib/client/sse";
import { STAGES, type AgentEvent, type Stage } from "@/lib/schema/events.schema";

export type StageStatus = "pending" | "active" | "done";
export type StageLog =
  | { kind: "search"; query: string; results: number }
  | { kind: "read"; url: string; title: string; domain: string }
  | { kind: "finding"; claim: string; sourceUrl: string }
  | { kind: "probe"; url: string; requiresLogin: boolean }
  | { kind: "verification"; downgraded: number; notes: string[] };

export type GenerateState = {
  status: "idle" | "running" | "recovering" | "done" | "error";
  query: string;
  slug: string | null;
  stages: Record<Stage, StageStatus>;
  logs: Record<Stage, StageLog[]>;
  reads: { url: string; title: string; domain: string }[];
  budget: { toolCalls: number; maxToolCalls: number; pagesRead: number; maxPages: number } | null;
  startedAt: number | null;
  finishedAt: number | null;
  result: { slug: string; url: string; cached: boolean } | null;
  error: { message: string; retryAfter?: number; fields?: { field: string; message: string }[] } | null;
};

const emptyStages = () => Object.fromEntries(STAGES.map((s) => [s, "pending"])) as Record<Stage, StageStatus>;
const emptyLogs = () => Object.fromEntries(STAGES.map((s) => [s, []])) as unknown as Record<Stage, StageLog[]>;

const initial: GenerateState = {
  status: "idle",
  query: "",
  slug: null,
  stages: emptyStages(),
  logs: emptyLogs(),
  reads: [],
  budget: null,
  startedAt: null,
  finishedAt: null,
  result: null,
  error: null,
};

type Action =
  | { type: "start"; query: string }
  | { type: "event"; event: AgentEvent }
  | { type: "recovering" }
  | { type: "fail"; error: GenerateState["error"] }
  | { type: "reset" };

function activeStage(s: GenerateState): Stage {
  return (STAGES.find((st) => s.stages[st] === "active") ?? "research") as Stage;
}

function reducer(s: GenerateState, a: Action): GenerateState {
  switch (a.type) {
    case "start":
      return { ...initial, status: "running", query: a.query, startedAt: Date.now(), stages: emptyStages(), logs: emptyLogs() };
    case "reset":
      return initial;
    case "recovering":
      return { ...s, status: "recovering" };
    case "fail":
      return { ...s, status: "error", error: a.error, finishedAt: Date.now() };
    case "event": {
      const e = a.event;
      const push = (stage: Stage, log: StageLog) => ({ ...s.logs, [stage]: [...s.logs[stage], log] });
      switch (e.type) {
        case "stage":
          return { ...s, slug: e.slug ?? s.slug, stages: { ...s.stages, [e.stage]: e.status === "start" ? "active" : "done" } };
        case "search":
          return { ...s, logs: push(activeStage(s), { kind: "search", query: e.query, results: e.results }) };
        case "read":
          return { ...s, reads: [...s.reads, { url: e.url, title: e.title, domain: e.domain }], logs: push(activeStage(s), { kind: "read", ...e }) };
        case "finding":
          return { ...s, logs: push(activeStage(s), { kind: "finding", claim: e.claim, sourceUrl: e.sourceUrl }) };
        case "probe":
          return { ...s, logs: push("probe", { kind: "probe", url: e.url, requiresLogin: e.requiresLogin }) };
        case "verification":
          return { ...s, logs: push("verify", { kind: "verification", downgraded: e.downgraded, notes: e.notes }) };
        case "budget":
          return { ...s, budget: { toolCalls: e.toolCalls, maxToolCalls: e.maxToolCalls, pagesRead: e.pagesRead, maxPages: e.maxPages } };
        case "guide_ready":
          return {
            ...s,
            status: "done",
            slug: e.slug,
            result: { slug: e.slug, url: e.url, cached: e.cached },
            stages: e.cached ? (Object.fromEntries(STAGES.map((st) => [st, "done"])) as Record<Stage, StageStatus>) : s.stages,
            finishedAt: Date.now(),
          };
        case "error":
          return { ...s, status: "error", error: { message: e.message }, finishedAt: Date.now() };
      }
    }
  }
}

const POLL_MS = 3_000;
const POLL_FOR_MS = 60_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useGenerate() {
  const [state, dispatch] = useReducer(reducer, initial);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const start = useCallback(async (query: string, forceRefresh = false) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    dispatch({ type: "start", query });

    let slug: string | null = null;
    let finished = false;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, forceRefresh }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body || !res.headers.get("content-type")?.includes("text/event-stream")) {
        const body = (await res.json().catch(() => null)) as { message?: string; details?: unknown } | null;
        const retryAfter = Number(res.headers.get("retry-after")) || undefined;
        const fields = Array.isArray(body?.details) ? (body.details as { field: string; message: string }[]) : undefined;
        dispatch({
          type: "fail",
          error: { message: fields?.[0]?.message ?? body?.message ?? "Something went wrong.", retryAfter: res.status === 429 ? retryAfter ?? 60 : undefined, fields },
        });
        return;
      }
      for await (const event of parseSse(res.body)) {
        if (event.type === "stage" && event.slug) slug = event.slug;
        if (event.type === "guide_ready" || event.type === "error") finished = true;
        dispatch({ type: "event", event });
      }
    } catch (err) {
      if (ac.signal.aborted) return;
      void err;
    }
    if (finished || ac.signal.aborted) return;

    // The stream dropped before the end. The server keeps running, so poll for the saved guide.
    if (!slug) {
      dispatch({ type: "fail", error: { message: "Lost connection before the run started. Try again." } });
      return;
    }
    dispatch({ type: "recovering" });
    const until = Date.now() + POLL_FOR_MS;
    while (Date.now() < until && !ac.signal.aborted) {
      await sleep(POLL_MS);
      const r = await fetch(`/api/guides/${slug}`, { signal: ac.signal }).catch(() => null);
      if (r?.ok) {
        dispatch({ type: "event", event: { type: "guide_ready", slug, url: `/guide/${slug}`, cached: false } });
        return;
      }
    }
    if (!ac.signal.aborted) dispatch({ type: "fail", error: { message: "Lost connection and the guide didn't appear. Try again." } });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "reset" });
  }, []);

  return { state, start, reset };
}
