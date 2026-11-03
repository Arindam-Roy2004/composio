import { tool } from "ai";
import { z } from "zod";
import { BUDGET, type RunState } from "@/lib/agent/state";
import { log } from "@/lib/log";

export const NoteInput = z.object({
  claim: z.string().min(5).max(300).describe("One specific, checkable finding"),
  source: z.string().max(2000).describe("The sourceId returned by readPage (e.g. \"s2\"), or that page's exact URL"),
  quote: z.string().max(300).describe("Short verbatim quote from that page"),
});

export const noteTool = (state: RunState) =>
  tool({
    description: "Record one finding with the page it came from. Only notes become guide content; anything not noted is lost.",
    inputSchema: NoteInput,
    execute: async (note) => {
      if (state.notes.length >= BUDGET.maxNotes) return { error: "Note limit reached." };
      const ref = note.source.trim();
      const source = /^s\d{1,2}$/.test(ref) ? state.sourceById(ref) : state.sourceFor(ref);
      if (!source) {
        log.warn("note rejected: unknown source", { ref: ref.slice(0, 120) });
        return { error: "source must be the sourceId (e.g. s2) of a page you read with readPage in this run." };
      }
      state.notes.push({ claim: note.claim, quote: note.quote, sourceUrl: source.url });
      state.emit({ type: "finding", claim: note.claim, sourceUrl: source.url });
      return { ok: true, sourceId: source.id };
    },
  });

export const ConsoleCandidateInput = z.object({
  url: z.url({ protocol: /^https$/ }).describe("The page where developers create/register the app"),
});

export const flagConsoleTool = (state: RunState) =>
  tool({
    description:
      "Record the URL of the developer console page where a developer creates/registers the OAuth app. " +
      "It is probed (observed, never signed into) after research. Call at most twice.",
    inputSchema: ConsoleCandidateInput,
    execute: async ({ url }) => {
      if (state.consoleCandidates.length >= BUDGET.maxConsoleProbes) return { error: "Already recorded enough console URLs." };
      if (!state.consoleCandidates.includes(url)) state.consoleCandidates.push(url);
      return { ok: true };
    },
  });
