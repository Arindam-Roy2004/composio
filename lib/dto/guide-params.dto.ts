import { z } from "zod";
import { BaseDto } from "@/lib/dto/base.dto";

export const SlugSchema = z
  .string()
  .max(64, "Slug is too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

// /guide/[slug] and /api/guides/[slug]
export class GuideParamsDto extends BaseDto {
  static schema = z.object({ slug: SlugSchema }).strict();
}

export type GuideParams = z.infer<typeof GuideParamsDto.schema>;
