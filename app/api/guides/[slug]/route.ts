import { GuideParamsDto, type GuideParams } from "@/lib/dto/guide-params.dto";
import { NotFoundError } from "@/lib/http/errors";
import { ok } from "@/lib/http/errorResponse";
import { route } from "@/lib/http/handler";
import { getGuide } from "@/lib/storage/guides";

export const dynamic = "force-dynamic";

export const GET = route<undefined, GuideParams>({ params: GuideParamsDto, rateLimit: "read" }, async ({ params }) => {
  const guide = await getGuide(params.slug);
  if (!guide) throw new NotFoundError("Guide not found");
  return ok(guide);
});
