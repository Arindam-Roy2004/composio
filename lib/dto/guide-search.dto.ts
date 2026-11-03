import { BaseDto } from "@/lib/dto/base.dto";
import { GuideQuerySchema } from "@/lib/guides/query";

// GET /api/guides/search?q=&source=&difficulty=&sort=&offset=&limit=
export class GuideSearchDto extends BaseDto {
  static schema = GuideQuerySchema;
}
