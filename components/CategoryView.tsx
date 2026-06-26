import { getNews } from "@/lib/rss";
import { translateItems } from "@/lib/translate";
import { resolveImages } from "@/lib/images";
import { CATEGORY_LABELS, CATEGORY_DESC, CATEGORY_ACCENT, type Category } from "@/lib/sources";
import { updatedAtLabel } from "@/lib/format";
import NewsFeed from "@/components/NewsFeed";

export default async function CategoryView({ category }: { category: Category }) {
  // 한 페이지에 너무 많은 기사/광고가 쌓이지 않도록 상한을 둔다.
  const raw = (await getNews(category)).slice(0, 45);
  const items = await resolveImages(await translateItems(raw));

  return (
    <div className="container-page py-8">
      <header className="mb-8 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span className="h-7 w-1.5 rounded-full" style={{ background: CATEGORY_ACCENT[category] }} />
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">
            {CATEGORY_LABELS[category]} 뉴스
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          {CATEGORY_DESC[category]} · 마지막 업데이트 {updatedAtLabel()}
        </p>
      </header>

      <NewsFeed items={items} showCategory={false} />
    </div>
  );
}
