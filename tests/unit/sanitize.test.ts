import { describe, expect, it } from "vitest";
import { domainToSlug, QueryRejectedError, sanitizeQuery } from "@/lib/security/sanitize";

describe("sanitizeQuery", () => {
  it("normalises a plain app name", () => {
    expect(sanitizeQuery("  Google   Calendar ")).toEqual({ display: "Google Calendar", slug: "google-calendar", kind: "name" });
  });

  it("strips control and zero-width characters", () => {
    expect(sanitizeQuery("Zo​om\u0007﻿").display).toBe("Zoom");
    expect(sanitizeQuery("Not­ion").slug).toBe("notion");
  });

  it("applies NFKC (full-width letters become ASCII)", () => {
    expect(sanitizeQuery("Ｓｌａｃｋ").slug).toBe("slack");
  });

  it("rejects emoji instead of mangling", () => {
    expect(() => sanitizeQuery("Slack 🚀")).toThrow(QueryRejectedError);
  });

  it("rejects HTML/script input", () => {
    expect(() => sanitizeQuery("<script>alert(1)</script>")).toThrow(QueryRejectedError);
  });

  it("keeps only the hostname of a URL with a path", () => {
    expect(sanitizeQuery("https://www.zoom.us/docs/oauth?x=1".replace("?x=1", ""))).toEqual({
      display: "zoom.us",
      slug: "zoom",
      kind: "domain",
      domain: "zoom.us",
    });
    expect(sanitizeQuery("developers.notion.com/docs").slug).toBe("notion");
  });

  it("rejects the cloud metadata IP", () => {
    expect(() => sanitizeQuery("http://169.254.169.254")).toThrow(QueryRejectedError);
    expect(() => sanitizeQuery("169.254.169.254")).toThrow(QueryRejectedError);
  });

  it("rejects localhost and non-http schemes", () => {
    expect(() => sanitizeQuery("http://localhost/admin")).toThrow(QueryRejectedError);
    expect(() => sanitizeQuery("ftp://example.com")).toThrow(QueryRejectedError);
  });

  it("enforces the 120 char limit", () => {
    expect(() => sanitizeQuery("a".repeat(121))).toThrow(/120/);
    expect(sanitizeQuery("a".repeat(120)).slug).toHaveLength(64);
  });

  it("rejects too-short input", () => {
    expect(() => sanitizeQuery(" a ")).toThrow(QueryRejectedError);
    expect(() => sanitizeQuery("​​")).toThrow(QueryRejectedError);
  });

  it("allows the documented punctuation", () => {
    expect(sanitizeQuery("AT&T (Developer) Q+A's_x").slug).toBe("at-t-developer-q-a-s-x");
  });
});

describe("domainToSlug", () => {
  it.each([
    ["zoom.us", "zoom"],
    ["www.calendly.com", "calendly"],
    ["api.slack.com", "slack"],
    ["example.co.uk", "example"],
    ["shop.example.co.uk", "example"],
  ])("%s → %s", (host, slug) => expect(domainToSlug(host)).toBe(slug));
});
