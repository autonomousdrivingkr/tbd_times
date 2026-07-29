import { getNews } from "@/lib/rss";
import { translateItems } from "@/lib/translate";
import { resolveImages } from "@/lib/images";
import {
  CATEGORY_LABELS,
  CATEGORY_DESC,
  CATEGORY_INTRO,
  CATEGORY_ACCENT,
  type Category,
} from "@/lib/sources";
import { updatedAtLabel } from "@/lib/format";
import NewsFeed from "@/components/NewsFeed";

export default async function CategoryView({ category }: { category: Category }) {
  // 한 페이지에 너무 많은 기사/광고가 쌓이지 않도록 상한을 둔다.
  const raw = (await getNews(category)).slice(0, 45);
  const translated = await translateItems(raw);
  // 번역이 필요했는데 실패/비활성으로 원문(영어 등)이 그대로 남은 항목은
  // 목록에서 제외한다 — 한국어 사이트에 번역 안 된 외국어 기사가 섞여 보이는
  // 것이 애드센스 "가치 낮은 콘텐츠" 반려의 원인 중 하나로 지목됐다. LLM
  // 쿼터가 회복되면 다음 재생성 때 자동으로 다시 노출된다.
  const items = await resolveImages(translated.filter((it) => it.translated !== false));

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
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-soft">
          {CATEGORY_INTRO[category]}
        </p>
      </header>

      <NewsFeed items={items} showCategory={false} />
    </div>
  );
}
