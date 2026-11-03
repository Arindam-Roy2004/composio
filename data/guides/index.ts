// Library guides are imported statically so they ship with the bundle (no fs at runtime).
// Add new library guides here; scripts/validate-library.ts checks every *.json is listed.
import github from "./github.json";

export const LIBRARY_RAW: Record<string, unknown> = {
  github,
};
