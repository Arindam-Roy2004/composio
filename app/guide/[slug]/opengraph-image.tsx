import { ImageResponse } from "next/og";
import { GuideParamsDto } from "@/lib/dto/guide-params.dto";
import { DIFFICULTY_META, formatApproval, formatMinutes } from "@/lib/format";
import { getGuide } from "@/lib/storage/guides";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "OAuth app setup guide";

const DIFF_COLOR = { easy: "#4ade80", moderate: "#facc15", hard: "#fb923c", gated: "#f87171" } as const;

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const r = GuideParamsDto.validate(await params);
  const guide = r.value ? await getGuide(r.value.slug) : null;
  const name = guide?.appName ?? "Guide not found";
  const diff = guide?.verdict.difficulty;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0b0b0d", color: "#f4f4f5", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 26, color: "#a1a1aa" }}>OAuth Navigator · setup guide</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3 }}>{name}</div>
          {guide && <div style={{ fontSize: 32, color: "#d4d4d8", marginTop: 16, maxWidth: 1000 }}>{guide.verdict.oneLiner}</div>}
        </div>
        {guide && diff && (
          <div style={{ display: "flex", gap: 24, fontSize: 30 }}>
            <div style={{ display: "flex", padding: "14px 24px", borderRadius: 16, border: `2px solid ${DIFF_COLOR[diff]}`, color: DIFF_COLOR[diff] }}>{DIFFICULTY_META[diff].label}</div>
            <div style={{ display: "flex", padding: "14px 24px", borderRadius: 16, border: "2px solid #3f3f46" }}>
              Active work {formatMinutes(guide.time.activeSetup.minMinutes, guide.time.activeSetup.maxMinutes)}
            </div>
            <div style={{ display: "flex", padding: "14px 24px", borderRadius: 16, border: "2px solid #3f3f46" }}>Approval {formatApproval(guide.time.approvalWait)}</div>
          </div>
        )}
      </div>
    ),
    size,
  );
}
