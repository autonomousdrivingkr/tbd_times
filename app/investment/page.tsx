import type { Metadata } from "next";
import { getNews, type NewsItem } from "@/lib/rss";
import { translateItems } from "@/lib/translate";
import { resolveImages } from "@/lib/images";
import { getTopic, filterByTopic, type Topic } from "@/lib/topics";
import {
  CATEGORY_LABELS,
  CATEGORY_DESC,
  CATEGORY_INTRO,
  CATEGORY_ACCENT,
} from "@/lib/sources";
import { updatedAtLabel } from "@/lib/format";
import { EMBEDDED_TOPIC_SLUGS } from "@/lib/sections";
import MarketDashboard from "@/components/MarketDashboard";
import NewsFeed from "@/components/NewsFeed";
import NewsCard from "@/components/NewsCard";
import SectionHeading from "@/components/SectionHeading";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "투자 뉴스",
  description:
    "미국·한국 증시 지수, 금·유가·금리·환율 등 거시경제 지표 대시보드와 연준·금리·비트코인 소식을 포함해 글로벌 증시·금융·시장 소식을 매일 정리합니다.",
};

const RELATED_TOPIC_LIMIT = 4;

export default async function InvestmentPage() {
  // 투자 섹션 소스만으로 연준·금리/비트코인 관련 뉴스까지 충당할 수 있도록 넉넉히 확보한다.
  const raw = await getNews("investment");

  // 연준·금리·비트코인은 별도 상단 섹션 대신 투자 뉴스 안에서 소주제로 묶어 보여준다.
  const usedLinks = new Set<string>();
  const relatedSections = EMBEDDED_TOPIC_SLUGS.map((slug) => {
    const topic = getTopic(slug);
    if (!topic) return null;
    const items = filterByTopic(raw, topic)
      .filter((it) => !usedLinks.has(it.link))
      .slice(0, RELATED_TOPIC_LIMIT);
    items.forEach((it) => usedLinks.add(it.link));
    return items.length > 0 ? { topic, items } : null;
  }).filter((s): s is { topic: Topic; items: NewsItem[] } => s !== null);

  const mainItems = raw.filter((it) => !usedLinks.has(it.link)).slice(0, 45);

  const displayed = [...mainItems, ...relatedSections.flatMap((s) => s.items)];
  const unique = Array.from(new Map(displayed.map((i) => [i.link, i])).values());
  const prepared = await resolveImages(await translateItems(unique));
  const pmap = new Map(prepared.map((i) => [i.link, i]));
  const tl = (arr: NewsItem[]) => arr.map((i) => pmap.get(i.link) ?? i);

  return (
    <div className="container-page py-8">
      <header className="mb-8 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span className="h-7 w-1.5 rounded-full" style={{ background: CATEGORY_ACCENT.investment }} />
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">
            {CATEGORY_LABELS.investment} 뉴스
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          {CATEGORY_DESC.investment} · 마지막 업데이트 {updatedAtLabel()}
        </p>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-soft">
          {CATEGORY_INTRO.investment}
        </p>
      </header>

      <MarketDashboard />

      {relatedSections.map(({ topic, items }) => (
        <section key={topic.slug} className="mb-12">
          <SectionHeading
            title={`${topic.emoji} ${topic.label}`}
            subtitle={topic.description}
            accent={CATEGORY_ACCENT.investment}
          />
          <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {tl(items).map((item) => (
              <NewsCard key={item.link} item={item} variant="compact" showCategory={false} />
            ))}
          </div>
        </section>
      ))}

      <NewsFeed items={tl(mainItems)} showCategory={false} />
    </div>
  );
}
