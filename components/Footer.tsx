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
            <Link href="/ai" className="text-ink-soft hover:text-accent">AI</Link>
            <Link href="/topic/semiconductor" className="text-ink-soft hover:text-accent">반도체</Link>
            <Link href="/investment" className="text-ink-soft hover:text-accent">투자</Link>
            <Link href="/topic/bigtech" className="text-ink-soft hover:text-accent">빅테크</Link>
            <Link href="/travel" className="text-ink-soft hover:text-accent">여행</Link>
            <Link href="/about" className="text-ink-soft hover:text-accent">소개</Link>
            <Link href="/glossary" className="text-ink-soft hover:text-accent">용어사전</Link>
            <Link href="/faq" className="text-ink-soft hover:text-accent">자주 묻는 질문</Link>
            <Link href="/contact" className="text-ink-soft hover:text-accent">문의</Link>
            <Link href="/terms" className="text-ink-soft hover:text-accent">이용약관</Link>
            <Link href="/privacy" className="text-ink-soft hover:text-accent">개인정보 처리방침</Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>
            © {year} Tibedra. 본 사이트는 외부 매체의 공개 RSS 피드를 기반으로 헤드라인과
            요약을 제공하며, 저작권은 각 매체에 있습니다. 콘텐츠는 정보 제공 목적이며 투자 권유가
            아닙니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
