import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-paper-2">
      <div className="container-page py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-serif text-xl font-bold">Tibedra</p>
            <p className="mt-2 text-sm text-muted">
              AI·반도체·투자·빅테크·여행 소식을 매일 아침 모아 해설과 함께 정리합니다.
              모든 브리핑은 원문 출처로 연결됩니다.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/briefing" className="text-ink-soft hover:text-accent">오늘의 브리핑</Link>
            <Link href="/blog" className="text-ink-soft hover:text-accent">블로그</Link>
            <Link href="/ai" className="text-ink-soft hover:text-accent">AI</Link>
            <Link href="/topic/semiconductor" className="text-ink-soft hover:text-accent">반도체</Link>
            <Link href="/investment" className="text-ink-soft hover:text-accent">투자</Link>
            <Link href="/topic/bigtech" className="text-ink-soft hover:text-accent">빅테크</Link>
            <Link href="/travel" className="text-ink-soft hover:text-accent">여행</Link>
            <Link href="/food" className="text-ink-soft hover:text-accent">맛집</Link>
            <Link href="/about" className="text-ink-soft hover:text-accent">소개</Link>
            <Link href="/glossary" className="text-ink-soft hover:text-accent">용어사전</Link>
            <Link href="/faq" className="text-ink-soft hover:text-accent">자주 묻는 질문</Link>
            <Link href="/contact" className="text-ink-soft hover:text-accent">문의</Link>
            <Link href="/terms" className="text-ink-soft hover:text-accent">이용약관</Link>
            <Link href="/privacy" className="text-ink-soft hover:text-accent">개인정보 처리방침</Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted">
            © {year} Tibedra. 본 사이트는 외부 매체의 공개 RSS 피드를 기반으로 헤드라인과
            요약을 제공하며, 저작권은 각 매체에 있습니다. 콘텐츠는 정보 제공 목적이며 투자 권유가
            아닙니다.
          </p>
          <Link
            href="/admin"
            className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            관리자
          </Link>
        </div>
      </div>
    </footer>
  );
}
