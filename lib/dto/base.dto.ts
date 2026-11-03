import { z } from "zod";

export type FieldError = { field: string; message: string };
export type DtoResult<T> = { errors: FieldError[]; value: null } | { errors: null; value: T };

export function toFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((i) => ({ field: i.path.join(".") || "body", message: i.message }));
}

// Ported from Sagewell backend/src/dto/base.dto.js
export abstract class BaseDto {
  static schema: z.ZodType = z.object({});

  static validate<T>(this: { schema: z.ZodType<T> }, data: unknown): DtoResult<T> {
    const r = this.schema.safeParse(data ?? {});
    if (!r.success) return { errors: toFieldErrors(r.error), value: null };
    return { errors: null, value: r.data };
  }
}

export type DtoClass<T> = { schema: z.ZodType<T>; validate(data: unknown): DtoResult<T> };
