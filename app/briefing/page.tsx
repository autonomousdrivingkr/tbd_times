import type { Metadata } from "next";
import Link from "next/link";
import { getDailyBriefing } from "@/lib/briefing";
import { listArchivedDates } from "@/lib/briefing-archive";
import { getNews } from "@/lib/rss";
import { translateItems } from "@/lib/translate";
import { todayLabel, dateKeyLabel } from "@/lib/format";
import { newsPath } from "@/lib/slug";
import AdSlot from "@/components/AdSlot";
import BriefingArticle from "@/components/BriefingArticle";

// 홈과 동일하게 30분 ISR (칼럼 자체는 날짜 단위로 캐싱되어 하루 한 번 생성).
export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const briefing = await getDailyBriefing();
  const title = briefing ? `오늘의 브리핑 — ${briefing.headline}` : "오늘의 브리핑";
  return {
    title,
    description:
      "Tibedra 편집팀이 매일 아침 AI·테크·투자 주요 뉴스를 3가지 테마로 정리해 해설하는 데일리 브리핑.",
    alternates: { canonical: "/briefing" },
    openGraph: { title, type: "article", url: `${siteUrl}/briefing` },
  };
}

export default async function BriefingPage() {
  const [briefing, archiveDates] = await Promise.all([
    getDailyBriefing(),
    listArchivedDates(14),
  ]);

  // 칼럼 생성 실패 시에도 페이지가 비지 않도록 최신 헤드라인으로 대체
  const fallback = briefing ? [] : await translateItems((await getNews()).slice(0, 10));

  // 아카이브 목록에서 오늘 날짜는 제외(바로 위에 이미 전문이 있음)
  const pastDates = archiveDates.filter((d) => d !== briefing?.date);

  const jsonLd = briefing
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: briefing.headline,
        description: briefing.intro,
        datePublished: `${briefing.date}T06:00:00+09:00`,
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "Tibedra 편집팀", url: `${siteUrl}/about` },
        publisher: { "@type": "Organization", name: "Tibedra", url: siteUrl },
        mainEntityOfPage: `${siteUrl}/briefing`,
      }
    : null;

  return (
    <div className="container-page max-w-3xl py-10">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Daily Briefing</p>
        <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-extrabold leading-snug">
          {briefing ? briefing.headline : "오늘의 브리핑"}
        </h1>
        <p className="mt-3 text-xs text-muted">
          {todayLabel()} · Tibedra 편집팀 · 매일 아침 06:00 발행 · AI 도구의 도움을 받아
          작성됩니다.
        </p>
      </header>

      {briefing ? (
        <BriefingArticle briefing={briefing} />
      ) : (
        <div className="mt-8">
          <p className="text-[15px] leading-relaxed text-ink-soft">
            오늘의 브리핑 칼럼을 준비하고 있습니다. 그동안 최신 주요 뉴스를 확인해 보세요.
          </p>
          <ul className="mt-5 space-y-3">
            {fallback.map((n) => (
              <li key={n.link}>
                <Link href={newsPath(n)} className="font-medium hover:text-accent">
                  {n.titleKo ?? n.title}
                </Link>
                <span className="ml-2 text-xs text-muted">{n.source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 광고 */}
      <div className="my-10">
        <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">
          Advertisement
        </p>
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} />
      </div>

      {/* 지난 브리핑 아카이브 */}
      {pastDates.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <h2 className="mb-4 font-serif text-lg font-bold">지난 브리핑</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {pastDates.map((d) => (
              <li key={d}>
                <Link
                  href={`/briefing/${d}`}
                  className="block rounded-md border border-line px-3 py-2 text-sm text-ink-soft hover:border-accent hover:text-accent"
                >
                  {dateKeyLabel(d)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-sm text-ink-soft">
        낯선 용어가 있었나요?{" "}
        <Link href="/glossary" className="text-accent hover:underline">
          용어사전
        </Link>
        에서 AI·투자·코인 핵심 개념을 확인할 수 있습니다.
      </p>
    </div>
  );
}
