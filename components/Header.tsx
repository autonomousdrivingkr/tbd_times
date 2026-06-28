import Link from "next/link";
import { todayLabel } from "@/lib/format";
import { TOPICS } from "@/lib/topics";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/ai", label: "AI" },
  { href: "/investment", label: "투자" },
  { href: "/crypto", label: "코인" },
];

export default function Header() {
  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur sticky top-0 z-40">
      <div className="container-page">
        {/* 상단 날짜 줄 */}
        <div className="flex items-center justify-between py-2 text-[11px] text-muted">
          <span className="tabular-nums">{todayLabel()}</span>
          <span className="hidden sm:inline tracking-widest uppercase">
            Daily AI &amp; Investment Briefing
          </span>
        </div>

        {/* 브랜드 */}
        <div className="flex flex-col items-center gap-1 border-t border-line py-5">
          <Link href="/" className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight">
            Tibedra
          </Link>
          <p className="text-xs sm:text-sm text-muted">
            매일 아침, 전세계 AI·투자 소식을 한눈에
          </p>
        </div>

        {/* 네비게이션 + 검색 */}
        <div className="flex items-center justify-between gap-3 border-t border-line">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-3 py-3 text-sm font-medium text-ink-soft hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <span className="mx-1 hidden h-4 w-px bg-line sm:inline-block" />
            {TOPICS.map((t) => (
              <Link
                key={t.slug}
                href={`/topic/${t.slug}`}
                className="hidden whitespace-nowrap px-3 py-3 text-sm text-muted hover:text-accent transition-colors md:inline-block"
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <form action="/search" className="relative shrink-0 py-2">
            <input
              type="search"
              name="q"
              placeholder="검색"
              aria-label="뉴스 검색"
              className="w-28 rounded-full border border-line bg-paper-2 py-1.5 pl-8 pr-3 text-sm outline-none transition-all focus:w-40 focus:border-accent sm:w-32 sm:focus:w-52"
            />
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
          </form>
        </div>
      </div>
    </header>
  );
}
