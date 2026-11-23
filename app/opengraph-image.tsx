import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FASHION DAILY";

// 사이트 공유 시 보이는 대표 이미지 (기본 글꼴에 한글이 없어 영문으로)
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#111", color: "#fff" }}>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>FASHION DAILY</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#bbb" }}>Daily fashion news · sales · drops · daily looks</div>
        <div style={{ fontSize: 32, marginTop: 48, color: "#888" }}>www.fashiondaily.co.kr</div>
      </div>
    ),
    size
  );
}
