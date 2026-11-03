import { describe, expect, it } from "vitest";
import { GenerateGuideDto } from "@/lib/dto/generate-guide.dto";
import { GuideParamsDto } from "@/lib/dto/guide-params.dto";

describe("GenerateGuideDto", () => {
  it("returns a sanitised query and defaults forceRefresh", () => {
    const r = GenerateGuideDto.validate({ query: " Zoom " });
    expect(r.errors).toBeNull();
    expect(r.value).toEqual({ query: { display: "Zoom", slug: "zoom", kind: "name" }, forceRefresh: false });
  });

  it("rejects unknown keys", () => {
    const r = GenerateGuideDto.validate({ query: "Zoom", admin: true });
    expect(r.value).toBeNull();
    expect(r.errors).toEqual([expect.objectContaining({ field: "body" })]);
  });

  it("shapes field errors as { field, message }", () => {
    const r = GenerateGuideDto.validate({ query: "<b>x</b>", forceRefresh: "yes" });
    expect(r.errors).toEqual(
      expect.arrayContaining([
        { field: "query", message: expect.stringContaining("letters") },
        { field: "forceRefresh", message: expect.any(String) },
      ]),
    );
  });

  it("rejects a missing body", () => {
    expect(GenerateGuideDto.validate(undefined).errors?.[0]?.field).toBe("query");
  });
});

describe("GuideParamsDto", () => {
  it.each(["github", "google-gmail", "a1"])("accepts %s", (slug) => expect(GuideParamsDto.validate({ slug }).errors).toBeNull());
  it.each(["GitHub", "-x", "a--b", "../etc", "a".repeat(65), "x_y"])("rejects %s", (slug) =>
    expect(GuideParamsDto.validate({ slug }).errors?.[0]?.field).toBe("slug"),
  );
  it("rejects extra params", () => expect(GuideParamsDto.validate({ slug: "x", y: 1 }).errors).not.toBeNull());
});
