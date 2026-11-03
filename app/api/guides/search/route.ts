import { GuideSearchDto } from "@/lib/dto/guide-search.dto";
import { ValidationError } from "@/lib/http/errors";
import { ok } from "@/lib/http/errorResponse";
import { route } from "@/lib/http/handler";
import { searchGuides } from "@/lib/storage/guides";

export const dynamic = "force-dynamic";

/** Paginated, filtered guide listing with facet counts. */
export const GET = route({ rateLimit: "read" }, async ({ req }) => {
  const r = GuideSearchDto.validate(Object.fromEntries(new URL(req.url).searchParams));
  if (r.errors) throw new ValidationError("Invalid query", r.errors);
  return ok(await searchGuides(r.value));
});
