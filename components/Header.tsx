import Link from "next/link";
import { todayLabel } from "@/lib/format";
import { TOPICS } from "@/lib/topics";
import { NAV_SECTIONS, PROMOTED_TOPIC_SLUGS, EMBEDDED_TOPIC_SLUGS } from "@/lib/sections";
import LangSwitcher from "@/components/LangSwitcher";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/briefing", label: "브리핑" },
  ...NAV_SECTIONS.map((s) => ({ href: s.href, label: s.label })),
  { href: "/blog", label: "블로그" },
];

// 상단 섹션으로 승격되거나 다른 섹션에 묶인 토픽은 칩에서 제외
const SECONDARY_TOPICS = TOPICS.filter(
  (t) => !PROMOTED_TOPIC_SLUGS.includes(t.slug) && !EMBEDDED_TOPIC_SLUGS.includes(t.slug)
);

export default function Header() {
  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur sticky top-0 z-40">
      <div className="container-page">
        {/* 상단 날짜 줄 + 언어 선택 */}
        <div className="flex items-center justify-between gap-2 py-2 text-[11px] text-muted">
          <span className="tabular-nums">{todayLabel()}</span>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline tracking-widest uppercase">
              Daily Tech · Markets · Travel Briefing
            </span>
            <LangSwitcher />
          </div>
        </div>

        {/* 브랜드 */}
        <div className="flex flex-col items-center gap-1 border-t border-line py-5">
          <Link href="/" className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight">
            Tibedra
          </Link>
          <p className="text-xs sm:text-sm text-muted">
            매일 아침, AI·테크·투자·여행 소식을 한눈에
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
            {SECONDARY_TOPICS.length > 0 && (
              <span className="mx-1 hidden h-4 w-px bg-line sm:inline-block" />
            )}
            {SECONDARY_TOPICS.map((t) => (
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
