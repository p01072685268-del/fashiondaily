import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import { getBoards } from "@/lib/boards";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: { default: "패션데일리 | 매일 패션 소식 커뮤니티", template: "%s | 패션데일리" },
  description: "매일 아침 국내외 패션 소식 브리핑, 세일·발매 정보, 데일리룩 인증까지. 패션을 좋아하는 사람들의 커뮤니티.",
  openGraph: { siteName: "패션데일리", locale: "ko_KR", type: "website" },
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
