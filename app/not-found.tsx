import Link from "next/link";
export default function NotFound() {
  return (
    <section className="card">
      <h1>페이지를 찾을 수 없어요</h1>
      <p><Link href="/">처음으로 돌아가기</Link></p>
    </section>
  );
}
