import { describe, expect, it } from "vitest";
import { formatApproval, formatMinutes } from "@/lib/format";

describe("formatMinutes", () => {
  it.each([
    [5, 15, "5–15 min"],
    [30, 120, "30 min–2 h"],
    [60, 180, "1–3 h"],
    [10, 10, "10 min"],
    [0, 0, "Unknown"],
    [90, 90, "1.5 h"],
  ])("%i–%i → %s", (a, b, out) => expect(formatMinutes(a, b)).toBe(out));
});

describe("formatApproval", () => {
  it.each([
    [{ required: "no" as const, minDays: 0, maxDays: 0 }, "None"],
    [{ required: "for_some_scopes" as const, minDays: 3, maxDays: 42 }, "3 days–6 wk"],
    [{ required: "always" as const, minDays: 14, maxDays: 42 }, "2–6 wk"],
    [{ required: "for_public_use" as const, minDays: null, maxDays: null }, "Timeline unpublished"],
    [{ required: "unknown" as const, minDays: null, maxDays: null }, "Unknown"],
    [{ required: "always" as const, minDays: 2, maxDays: 5 }, "2–5 days"],
  ])("%o → %s", (a, out) => expect(formatApproval(a)).toBe(out));
});
