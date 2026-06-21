import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-paper-2">
      <div className="container-page py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-serif text-xl font-bold">TBD Times</p>
            <p className="mt-2 text-sm text-muted">
              전세계 AI·투자 뉴스를 매일 아침 자동으로 모아 정리합니다. 모든 기사는
              요약과 함께 원문 출처로 연결됩니다.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/ai" className="text-ink-soft hover:text-accent">AI 뉴스</Link>
            <Link href="/investment" className="text-ink-soft hover:text-accent">투자 뉴스</Link>
            <Link href="/crypto" className="text-ink-soft hover:text-accent">코인 뉴스</Link>
            <Link href="/about" className="text-ink-soft hover:text-accent">소개</Link>
            <Link href="/privacy" className="text-ink-soft hover:text-accent">개인정보 처리방침</Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>
            © {year} TBD Times. 본 사이트는 외부 매체의 공개 RSS 피드를 기반으로 헤드라인과
            요약을 제공하며, 저작권은 각 매체에 있습니다. 콘텐츠는 정보 제공 목적이며 투자 권유가
            아닙니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
