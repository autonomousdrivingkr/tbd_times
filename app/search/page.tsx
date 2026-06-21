import type { Metadata } from "next";
import Link from "next/link";
import { getNews } from "@/lib/rss";
import { translateItems } from "@/lib/translate";
import { searchNews, TOPICS } from "@/lib/topics";
import NewsCard from "@/components/NewsCard";
import AdSlot from "@/components/AdSlot";

export const metadata: Metadata = {
  title: "검색",
  description: "TBD Times 에 수집된 AI·투자·코인 뉴스를 키워드로 검색합니다.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const all = query ? await getNews() : [];
  const matched = query ? searchNews(all, query).slice(0, 36) : [];
  const items = await translateItems(matched);

  return (
    <div className="container-page py-8">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="font-serif text-3xl font-extrabold">뉴스 검색</h1>
        <form action="/search" className="mt-4 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="예: nvidia, 금리, 비트코인"
            className="w-full max-w-md rounded-full border border-line bg-paper-2 px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            검색
          </button>
        </form>
        {query && (
          <p className="mt-3 text-sm text-muted">
            <strong className="text-ink">&ldquo;{query}&rdquo;</strong> 검색 결과 {items.length}건
          </p>
        )}
      </header>

      {!query && (
        <div className="py-8">
          <p className="mb-3 text-sm text-muted">추천 토픽으로 둘러보기</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <Link
                key={t.slug}
                href={`/topic/${t.slug}`}
                className="rounded-full border border-line bg-paper-2 px-4 py-2 text-sm hover:border-accent hover:text-accent"
              >
                {t.emoji} {t.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {query && items.length > 0 && (
        <>
          <section className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <NewsCard key={item.link} item={item} showCategory />
            ))}
          </section>
          <div className="my-10">
            <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED} className="mx-auto max-w-3xl" />
          </div>
        </>
      )}

      {query && items.length === 0 && (
        <p className="py-20 text-center text-muted">
          검색 결과가 없습니다. 다른 키워드로 시도해 보세요.
        </p>
      )}
    </div>
  );
}
