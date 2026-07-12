import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBriefingByDate, kstDateKey } from "@/lib/briefing";
import { listArchivedDates } from "@/lib/briefing-archive";
import { dateKeyLabel } from "@/lib/format";
import AdSlot from "@/components/AdSlot";
import BriefingArticle from "@/components/BriefingArticle";

// 아카이브 글은 한 번 저장되면 내용이 바뀌지 않으므로 캐시 수명을 길게 둔다(하루).
export const revalidate = 86400;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function generateStaticParams() {
  const dates = await listArchivedDates(60);
  return dates.map((date) => ({ date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!DATE_RE.test(date)) return { title: "브리핑을 찾을 수 없습니다", robots: { index: false } };
  const briefing = await getBriefingByDate(date);
  if (!briefing) return { title: "브리핑을 찾을 수 없습니다", robots: { index: false } };
  const title = `${dateKeyLabel(date)} 브리핑 — ${briefing.headline}`;
  return {
    title,
    description: briefing.intro,
    alternates: { canonical: `/briefing/${date}` },
    openGraph: { title, type: "article", url: `${siteUrl}/briefing/${date}` },
  };
}

export default async function BriefingByDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();
  // 오늘 날짜는 실시간 페이지(/briefing)로 통합 — 아카이브와 중복 URL을 만들지 않는다.
  if (date === kstDateKey()) redirect("/briefing");

  const briefing = await getBriefingByDate(date);
  if (!briefing) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: briefing.headline,
    description: briefing.intro,
    datePublished: `${briefing.date}T06:00:00+09:00`,
    inLanguage: "ko-KR",
    author: { "@type": "Organization", name: "Tibedra 편집팀", url: `${siteUrl}/about` },
    publisher: { "@type": "Organization", name: "Tibedra", url: siteUrl },
    mainEntityOfPage: `${siteUrl}/briefing/${date}`,
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-accent">
          <Link href="/briefing" className="hover:underline">
            Daily Briefing 아카이브
          </Link>
        </p>
        <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-extrabold leading-snug">
          {briefing.headline}
        </h1>
        <p className="mt-3 text-xs text-muted">
          {dateKeyLabel(date)} · Tibedra 편집팀 · AI 도구의 도움을 받아 작성됩니다.
        </p>
      </header>

      <BriefingArticle briefing={briefing} />

      {/* 광고 */}
      <div className="my-10">
        <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">
          Advertisement
        </p>
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} />
      </div>

      <p className="text-sm text-ink-soft">
        <Link href="/briefing" className="text-accent hover:underline">
          ← 오늘의 브리핑과 지난 기록 전체 보기
        </Link>
      </p>
    </div>
  );
}
