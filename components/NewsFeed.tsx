import { Fragment } from "react";
import { type NewsItem } from "@/lib/rss";
import NewsCard from "@/components/NewsCard";
import AdSlot from "@/components/AdSlot";

function InlineAd({ slot }: { slot?: string }) {
  return (
    <div className="my-8">
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">
        Advertisement
      </p>
      <AdSlot slot={slot} className="mx-auto max-w-3xl" />
    </div>
  );
}

/**
 * 톱기사 + 본문 그리드(중간 광고 포함) 표시용 공용 피드.
 * items 는 이미 슬라이스/번역이 끝난 상태로 전달한다.
 */
export default function NewsFeed({
  items,
  showCategory = false,
  adEvery = 8,
}: {
  items: NewsItem[];
  showCategory?: boolean;
  adEvery?: number;
}) {
  if (items.length === 0) {
    return (
      <p className="py-20 text-center text-muted">
        표시할 뉴스가 없습니다. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  const lead = items[0];
  const rest = items.slice(1);

  return (
    <>
      <section className="mb-8">
        <NewsCard item={lead} variant="lead" showCategory={showCategory} />
      </section>

      <InlineAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} />

      <section className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((item, i) => (
          <Fragment key={item.link}>
            <NewsCard item={item} showCategory={showCategory} />
            {(i + 1) % adEvery === 0 && i !== rest.length - 1 && (
              <div className="sm:col-span-2 lg:col-span-3 my-2">
                <AdSlot
                  slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED}
                  className="mx-auto max-w-3xl"
                />
              </div>
            )}
          </Fragment>
        ))}
      </section>
    </>
  );
}
