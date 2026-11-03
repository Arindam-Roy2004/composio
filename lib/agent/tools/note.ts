import { tool } from "ai";
import { z } from "zod";
import { BUDGET, type RunState } from "@/lib/agent/state";

export const NoteInput = z.object({
  claim: z.string().min(5).max(300).describe("One specific, checkable finding"),
  sourceUrl: z.url().describe("URL of a page you READ with readPage that supports the claim"),
  quote: z.string().max(300).describe("Short verbatim quote from that page"),
});

export const noteTool = (state: RunState) =>
  tool({
    description: "Record one finding with the page it came from. Only notes become guide content; anything not noted is lost.",
    inputSchema: NoteInput,
    execute: async (note) => {
      if (state.notes.length >= BUDGET.maxNotes) return { error: "Note limit reached." };
      const source = state.sourceFor(note.sourceUrl);
      if (!source) return { error: "sourceUrl must be a page you read with readPage in this run." };
      state.notes.push({ ...note, sourceUrl: source.url });
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
