import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import { getBoards } from "@/lib/boards";
import { Analytics } from "@vercel/analytics/next";

import { SITE } from "@/lib/site";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  alternates: { canonical: "/" },
  keywords: ["패션", "패션 뉴스", "패션 브리핑", "패밀리세일", "세일 정보", "콜라보", "신발 발매", "데일리룩", "코디", "패션 커뮤니티", "무신사", "브랜드 소식"],
  robots: { index: true, follow: true },
  // 네이버·구글 소유 확인 코드는 받으면 여기에 넣기
  verification: { google: undefined, other: {} },
  title: { default: "패션데일리 | 매일 패션 소식 커뮤니티", template: "%s | 패션데일리" },
  description: "매일 아침 국내외 패션 소식 브리핑, 세일·발매 정보, 데일리룩 인증까지. 패션을 좋아하는 사람들의 커뮤니티.",
  openGraph: { siteName: "패션데일리", locale: "ko_KR", type: "website", url: SITE },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#111111" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const boards = await getBoards();
  return (
    <html lang="ko">
      <body>
        <header className="top">
          <div className="wrap row">
            <Link href="/" className="logo">패션<b>데일리</b></Link>
            <AuthButton />
          </div>
          <nav className="wrap boards">
            {boards.map((b) => (
              <Link key={b.slug} href={`/b/${b.slug}`}>{b.emoji} {b.name}</Link>
            ))}
          </nav>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap foot">
          <p>패션데일리 · 매일 패션 소식을 나누는 커뮤니티</p>
          <p>브리핑의 기사 내용은 요약이며, 저작권은 각 원문 매체에 있습니다.</p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
