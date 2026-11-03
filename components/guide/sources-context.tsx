"use client";

import { createContext, useContext } from "react";
import type { Source } from "@/lib/schema/guide.schema";

const SourcesContext = createContext<Map<string, Source>>(new Map());

export function SourcesProvider({ sources, children }: { sources: Source[]; children: React.ReactNode }) {
  return <SourcesContext.Provider value={new Map(sources.map((s) => [s.id, s]))}>{children}</SourcesContext.Provider>;
}

export const useSources = () => useContext(SourcesContext);
