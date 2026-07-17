import { Fragment } from "react";
import Link from "next/link";
import { getNews, type NewsItem } from "@/lib/rss";
import { getDailyBriefing } from "@/lib/briefing";
import { translateItems } from "@/lib/translate";
import { resolveImages } from "@/lib/images";
import { updatedAtLabel } from "@/lib/format";
import { TOPICS, getTopic, filterByTopic } from "@/lib/topics";
import { NAV_SECTIONS, PROMOTED_TOPIC_SLUGS, EMBEDDED_TOPIC_SLUGS } from "@/lib/sections";
import { getRestaurants, type Place } from "@/lib/naver-local";
import { getExercisePlaces } from "@/lib/naver-exercise";
import NewsCard from "@/components/NewsCard";
import SectionHeading from "@/components/SectionHeading";
import AdSlot from "@/components/AdSlot";
import DailyTerms from "@/components/DailyTerms";
import RestaurantCard from "@/components/RestaurantCard";

// 30분마다 정적 페이지를 재생성(ISR). 아침 Cron 이 강제 무효화도 한다.
export const revalidate = 1800;

// 상단 섹션으로 승격되거나 다른 섹션에 묶인 토픽은 칩에서 제외
const SECONDARY_TOPICS = TOPICS.filter(
  (t) => !PROMOTED_TOPIC_SLUGS.includes(t.slug) && !EMBEDDED_TOPIC_SLUGS.includes(t.slug)
);

// 뉴스(NewsItem) 기반 섹션만 — "places"(맛집·운동/건강)는 데이터 형태가 달라 별도 처리한다.
const NEWS_SECTIONS = NAV_SECTIONS.filter((s) => s.kind !== "places");
const PLACES_SECTIONS = NAV_SECTIONS.filter((s) => s.kind === "places");
const PLACES_FETCHERS: Record<string, () => Promise<Place[]>> = {
  food: getRestaurants,
  exercise: getExercisePlaces,
};

export default async function HomePage() {
  const [all, briefing, placesData] = await Promise.all([
    getNews(),
    getDailyBriefing(),
    Promise.all(PLACES_SECTIONS.map((s) => PLACES_FETCHERS[s.key]?.() ?? Promise.resolve([]))),
  ]);

  // 상단 섹션별 상위 항목 선별 (카테고리 또는 키워드 토픽)
  const sections = NEWS_SECTIONS.map((s) => {
    let items: NewsItem[];
    if (s.kind === "category") {
      items = all.filter((n) => n.category === s.key);
    } else {
      const topic = getTopic(s.key);
      items = topic ? filterByTopic(all, topic) : [];
    }
    return { ...s, items: items.slice(0, 6) };
  });

  const leadRaw = all[0];
  const sidebarRaw = all.slice(1, 6);

  // 표시할 항목만 중복 없이 모아 한 번에 번역 + 이미지 보강
  const displayed = [leadRaw, ...sidebarRaw, ...sections.flatMap((s) => s.items)].filter(
    Boolean
  ) as NewsItem[];
  const unique = Array.from(new Map(displayed.map((i) => [i.link, i])).values());
  const prepared = await resolveImages(await translateItems(unique));
  const pmap = new Map(prepared.map((i) => [i.link, i]));
  const t = (item?: NewsItem) => (item ? pmap.get(item.link) ?? item : undefined);
  const tl = (arr: NewsItem[]) => arr.map((i) => pmap.get(i.link) ?? i);

  const lead = t(leadRaw);
  const sidebar = tl(sidebarRaw);

  const inlineAds = [
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE,
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED,
  ];

  return (
    <div className="container-page py-8">
      {/* 오늘의 브리핑 (데일리 칼럼으로 연결) — 홈 최상단에 자체 콘텐츠를 실제 본문과 함께 노출 */}
      <Link
        href="/briefing"
        className="mb-8 block rounded-lg bg-accent-soft px-5 py-4 transition-opacity hover:opacity-90"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-xs font-bold uppercase tracking-widest text-accent">
            📰 오늘의 브리핑 · Tibedra 편집팀
          </p>
          <p className="text-xs text-ink-soft">
            <span className="mr-3 hidden sm:inline">
              마지막 업데이트{" "}
              <span className="tabular-nums font-medium">{updatedAtLabel()}</span>
            </span>
            <span className="font-semibold text-accent">전문 보기 →</span>
          </p>
        </div>
        {briefing ? (
          <>
            <p className="mt-2 font-serif text-xl font-bold text-ink sm:text-2xl">
              {briefing.headline}
            </p>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-soft line-clamp-2">
              {briefing.intro}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">오늘의 브리핑 칼럼을 준비하고 있습니다.</p>
        )}
      </Link>

      {/* 오늘의 용어 — 자체 콘텐츠를 아그리게이션 목록보다 먼저 노출 */}
      <DailyTerms />

      {/* 보조 토픽 칩 */}
      {SECONDARY_TOPICS.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {SECONDARY_TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topic/${topic.slug}`}
              className="rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-accent hover:text-accent"
            >
              {topic.emoji} {topic.label}
            </Link>
          ))}
        </div>
      )}

      {/* 톱스토리 */}
      {lead && (
        <section className="mb-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NewsCard item={lead} variant="lead" />
          </div>
          <aside className="lg:col-span-1">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">
              실시간 최신
            </h2>
            <div className="space-y-4 divide-y divide-line [&>*]:pt-4 first:[&>*]:pt-0">
              {sidebar.map((item) => (
                <NewsCard key={item.link} item={item} variant="compact" />
              ))}
            </div>

            {/* 사이드바 광고 */}
            <div className="mt-8">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-muted">
                Advertisement
              </p>
              <AdSlot
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR}
                className="sticky top-24"
              />
            </div>
          </aside>
        </section>
      )}

      {/* 섹션들 (AI · 반도체 · 투자 · 빅테크 · 여행) */}
      {sections.map((section, idx) => (
        <Fragment key={section.key}>
          <Section
            title={section.label}
            subtitle={section.subtitle}
            href={section.href}
            accent={section.accent}
            items={tl(section.items)}
          />
          {idx === 0 && <AdRow slot={inlineAds[0]} />}
          {idx === 2 && <AdRow slot={inlineAds[1]} />}
        </Fragment>
      ))}

      {/* 맛집·운동/건강 — 네이버 지역정보 기반, 뉴스와 데이터 형태가 달라 별도 렌더 */}
      {PLACES_SECTIONS.map((section, idx) => {
        const places = placesData[idx];
        if (places.length === 0) return null;
        return (
          <section key={section.key} className="mb-14">
            <SectionHeading
              title={section.label}
              subtitle={section.subtitle}
              href={section.href}
              accent={section.accent}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {places.slice(0, 6).map((p) => (
                <RestaurantCard
                  key={p.id}
                  place={p}
                  accent={section.accent}
                  accentSoft={section.accentSoft}
                />
              ))}
            </div>
          </section>
        );
      })}

      {all.length === 0 && (
        <p className="py-20 text-center text-muted">
          현재 뉴스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  href,
  accent,
  items,
}: {
  title: string;
  subtitle: string;
  href: string;
  accent: string;
  items: NewsItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-14">
      <SectionHeading title={title} subtitle={subtitle} href={href} accent={accent} />
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <NewsCard key={item.link} item={item} showCategory={false} />
        ))}
      </div>
    </section>
  );
}

function AdRow({ slot }: { slot?: string }) {
  return (
    <div className="my-10">
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">
        Advertisement
      </p>
      <AdSlot slot={slot} className="mx-auto max-w-3xl" />
    </div>
  );
}
