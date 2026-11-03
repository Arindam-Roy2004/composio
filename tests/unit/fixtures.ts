import github from "@/data/guides/github.json";
import type { Guide } from "@/lib/schema/guide.schema";

export const baseGuide = (): Guide => structuredClone(github) as Guide;
