import { faviconUrl } from "@/lib/format";

/** beUI citation favicons use the same source as the rest of the app. */
export function getFaviconUrl(value: string) {
  try {
    return faviconUrl(new URL(value).toString(), 32);
  } catch {
    return null;
  }
}
