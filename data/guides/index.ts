// Library guides are imported statically so they ship with the bundle (no fs at runtime).
// Add new library guides here; scripts/validate-library.ts checks every *.json is listed.
import github from "./github.json";
import gmail from "./gmail.json";
import linkedin from "./linkedin.json";
import notion from "./notion.json";
import slack from "./slack.json";

// Ordered easy → gated so the library reads as a difficulty range.
export const LIBRARY_RAW: Record<string, unknown> = {
  github,
  notion,
  slack,
  gmail,
  linkedin,
};
