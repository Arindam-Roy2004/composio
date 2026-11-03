import { ok } from "@/lib/http/errorResponse";
import { route } from "@/lib/http/handler";
import { listGuides } from "@/lib/storage/guides";

export const dynamic = "force-dynamic";

export const GET = route({ rateLimit: "read" }, async () => ok(await listGuides()));
