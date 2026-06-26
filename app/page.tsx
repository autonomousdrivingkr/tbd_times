import Link from "next/link";
import { getNews, type NewsItem } from "@/lib/rss";
import { translateItems } from "@/lib/translate";
import { resolveImages } from "@/lib/images";
import { updatedAtLabel } from "@/lib/format";
import { TOPICS } from "@/lib/topics";
import NewsCard from "@/components/NewsCard";
import SectionHeading from "@/components/SectionHeading";
import AdSlot from "@/components/AdSlot";

// 30분마다 정적 페이지를 재생성(ISR). 아침 Cron 이 강제 무효화도 한다.
export const revalidate = 1800;

export default async function HomePage() {
  const all = await getNews();
  const aiRaw = all.filter((n) => n.category === "ai").slice(0, 6);
  const investRaw = all.filter((n) => n.category === "investment").slice(0, 6);
  const cryptoRaw = all.filter((n) => n.category === "crypto").slice(0, 6);
  const leadRaw = all[0];
  const sidebarRaw = all.slice(1, 6);

  // 표시할 항목만 중복 없이 모아 한 번에 번역
  const displayed = [leadRaw, ...sidebarRaw, ...aiRaw, ...investRaw, ...cryptoRaw].filter(
    Boolean
  ) as NewsItem[];
  const unique = Array.from(new Map(displayed.map((i) => [i.link, i])).values());
  const translated = await resolveImages(await translateItems(unique));
  const tmap = new Map(translated.map((i) => [i.link, i]));
  const t = (item?: NewsItem) => (item ? tmap.get(item.link) ?? item : undefined);
  const tl = (arr: NewsItem[]) => arr.map((i) => tmap.get(i.link) ?? i);

  const lead = t(leadRaw);
  const sidebar = tl(sidebarRaw);
  const ai = tl(aiRaw);
  const investment = tl(investRaw);
  const crypto = tl(cryptoRaw);

  return (
    <div className="container-page py-8">
      {/* 오늘의 브리핑 바 */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-accent-soft px-4 py-3">
        <p className="text-sm font-semibold text-accent">📰 오늘의 브리핑</p>
        <p className="text-xs text-ink-soft">
          마지막 업데이트 <span className="tabular-nums font-medium">{updatedAtLabel()}</span> · 매일
          아침 06:00 자동 갱신
        </p>
      </div>

      {/* 토픽 칩 */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/topic/${topic.slug}`}
            className="rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-accent hover:text-accent"
          >
            {topic.emoji} {topic.label}
          </Link>
        ))}
      </div>

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

      {/* 인라인 광고 1 */}
      <AdRow slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} />

      {/* AI 섹션 */}
      <Section
        title="AI · 인공지능"
        subtitle="전세계 빅테크·반도체·AI 연구 동향"
        href="/ai"
        accent="var(--color-ai)"
        items={ai}
      />

      {/* 인라인 광고 2 */}
      <AdRow slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED} />

      {/* 투자 섹션 */}
      <Section
        title="투자 · 금융"
        subtitle="글로벌 증시·시장 소식"
        href="/investment"
        accent="var(--color-invest)"
        items={investment}
      />

      {/* 코인 섹션 */}
      <Section
        title="코인 · 가상자산"
        subtitle="비트코인·블록체인 동향"
        href="/crypto"
        accent="var(--color-crypto)"
        items={crypto}
      />

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
