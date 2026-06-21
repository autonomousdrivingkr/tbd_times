import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-32 text-center">
      <p className="font-serif text-6xl font-extrabold text-accent">404</p>
      <h1 className="mt-4 font-serif text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
