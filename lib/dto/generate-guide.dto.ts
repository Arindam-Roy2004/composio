import { z } from "zod";
import { BaseDto } from "@/lib/dto/base.dto";
import { QUERY_MAX, QueryRejectedError, sanitizeQuery } from "@/lib/security/sanitize";

// POST /api/generate
export class GenerateGuideDto extends BaseDto {
  static schema = z
    .object({
      query: z
        .string({ error: "Enter an app name or website" })
        // Generous raw cap; sanitizeQuery enforces QUERY_MAX after stripping invisibles.
        .max(QUERY_MAX * 4, `Keep it under ${QUERY_MAX} characters`)
        .transform((value, ctx) => {
          try {
            return sanitizeQuery(value);
          } catch (err) {
            if (!(err instanceof QueryRejectedError)) throw err;
            ctx.addIssue({ code: "custom", message: err.message });
            return z.NEVER;
          }
        }),
      forceRefresh: z.boolean().optional().default(false),
    })
    .strict();
}

export type GenerateGuideInput = z.infer<typeof GenerateGuideDto.schema>;
