import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNews, type NewsItem } from "@/lib/rss";
import { translateItems } from "@/lib/translate";
import { resolveImages } from "@/lib/images";
import { getAnalysis, matchGlossaryTerms } from "@/lib/analysis";
import { findBySlug, newsSlug } from "@/lib/slug";
import { dateLabel } from "@/lib/format";
import CategoryBadge from "@/components/CategoryBadge";
import Thumb from "@/components/Thumb";
import NewsCard from "@/components/NewsCard";
import AdSlot from "@/components/AdSlot";

// 홈과 동일하게 30분 ISR. 피드에서 사라진 오래된 기사는 404 처리된다.
export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// generateMetadata 와 페이지 본문이 같은 조회 결과를 공유하도록 요청 단위 메모이즈.
const getBriefing = cache(async (slug: string) => {
  const all = await getNews();
  const raw = findBySlug(all, slug);
  if (!raw) return null;
  const [item] = await resolveImages(await translateItems([raw]));
  const related = all
    .filter((n) => n.category === raw.category && n.link !== raw.link)
    .slice(0, 4);
  return { item, related: await translateItems(related) };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBriefing(slug);
  // 루트 loading.tsx 스트리밍 때문에 상태코드는 200 으로 나가므로(사이트 공통),
  // 피드에서 사라진 브리핑은 noindex 로 색인에서 제외한다.
  if (!data) return { title: "브리핑을 찾을 수 없습니다", robots: { index: false } };
  const { item } = data;
  const title = item.titleKo ?? item.title;
  const description = (item.summaryKo ?? item.summary) || `${item.source} 보도를 Tibedra 편집팀이 요약·해설한 브리핑`;
  return {
    title,
    description,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/news/${slug}`,
      images: item.image ? [{ url: item.image }] : undefined,
    },
  };
}

export default async function NewsBriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBriefing(slug);
  if (!data) notFound();

  const { item, related } = data;
  const title = item.titleKo ?? item.title;
  const summary = item.summaryKo ?? item.summary;
  const originalTitle = item.titleKo && item.titleKo !== item.title ? item.title : null;

  const analysis = await getAnalysis(item);
  const matchText = [title, summary, analysis?.background, analysis?.outlook]
    .filter(Boolean)
    .join(" ");
  const terms = matchGlossaryTerms(matchText);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: summary,
    image: item.image ? [item.image] : undefined,
    datePublished: item.isoDate ?? undefined,
    inLanguage: "ko-KR",
    author: { "@type": "Organization", name: "Tibedra 편집팀", url: `${siteUrl}/about` },
    publisher: { "@type": "Organization", name: "Tibedra", url: siteUrl },
    mainEntityOfPage: `${siteUrl}/news/${newsSlug(item.link)}`,
    isBasedOn: item.link,
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 헤더 */}
      <header>
        <div className="flex items-center gap-2 text-xs text-muted">
          <CategoryBadge category={item.category} />
          <span className="font-medium text-ink-soft">{item.source}</span>
          {item.isoDate && <span>· {dateLabel(item.isoDate)}</span>}
        </div>
        <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-extrabold leading-snug">
          {title}
        </h1>
        {originalTitle && (
          <p className="mt-2 text-sm text-muted">원문 제목: {originalTitle}</p>
        )}
        <p className="mt-3 text-xs text-muted">
          Tibedra 편집팀 · AI 도구의 도움을 받아 원문을 요약·해설한 브리핑입니다.
        </p>
      </header>

      {item.image && (
        <Thumb
          src={item.image}
          alt={title}
          className="mt-6 aspect-[16/9] w-full rounded-lg"
        />
      )}

      {/* 요약 + 해설 */}
      <div className="mt-8 space-y-6 text-[16px] leading-relaxed text-ink">
        {analysis ? (
          <>
            <p className="font-medium">{analysis.lead}</p>

            <section>
              <h2 className="mb-2 font-serif text-xl font-bold">배경과 맥락</h2>
              <p className="text-ink-soft">{analysis.background}</p>
            </section>

            {analysis.points.length > 0 && (
              <section className="rounded-lg bg-paper-2 p-5">
                <h2 className="mb-3 font-serif text-lg font-bold">핵심 포인트</h2>
                <ul className="space-y-2 text-[15px] text-ink-soft">
                  {analysis.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="mb-2 font-serif text-xl font-bold">왜 중요한가</h2>
              <p className="text-ink-soft">{analysis.outlook}</p>
            </section>
          </>
        ) : (
          summary && <p className="text-ink-soft">{summary}</p>
        )}
      </div>

      {/* 원문 링크 */}
      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper-2 p-4">
        <p className="text-sm text-ink-soft">
          이 브리핑은 <span className="font-semibold">{item.source}</span> 보도를 바탕으로
          작성됐습니다. 정확한 세부 내용은 원문에서 확인하세요.
        </p>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          원문 기사 보기 ↗
        </a>
      </div>

      {/* 관련 용어 */}
      {terms.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-serif text-xl font-bold">함께 알아두면 좋은 용어</h2>
          <dl className="divide-y divide-line rounded-lg border border-line">
            {terms.map((t) => (
              <div key={t.term} className="p-4">
                <dt className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    href={`/glossary#${t.group}`}
                    className="font-bold text-ink hover:text-accent"
                  >
                    {t.term}
                  </Link>
                  {t.en && <span className="text-xs text-muted">{t.en}</span>}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{t.def}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-right text-xs">
            <Link href="/glossary" className="text-accent hover:underline">
              용어사전 전체 보기 →
            </Link>
          </p>
        </section>
      )}

      {/* 광고 */}
      <div className="my-10">
        <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">
          Advertisement
        </p>
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} />
      </div>

      {/* 관련 뉴스 */}
      {related.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-xl font-bold">관련 브리핑</h2>
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
            {related.map((n: NewsItem) => (
              <NewsCard key={n.link} item={n} showCategory={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
