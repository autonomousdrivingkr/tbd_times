import Link from "next/link";
import { type NewsItem } from "@/lib/rss";
import { relativeTime } from "@/lib/format";
import { newsPath } from "@/lib/slug";
import CategoryBadge from "./CategoryBadge";
import Thumb from "./Thumb";

type Variant = "lead" | "default" | "compact";

export default function NewsCard({
  item,
  variant = "default",
  showCategory = true,
}: {
  item: NewsItem;
  variant?: Variant;
  showCategory?: boolean;
}) {
  const title = item.titleKo ?? item.title;
  const summary = item.summaryKo ?? item.summary;
  const originalTitle = item.titleKo && item.titleKo !== item.title ? item.title : null;
  // 카드는 사이트 내부 브리핑 페이지로 연결한다 (원문 링크는 브리핑 페이지 안에 있음).
  const href = newsPath(item);

  const meta = (
    <div className="flex items-center gap-2 text-xs text-muted">
      {showCategory && <CategoryBadge category={item.category} />}
      <span className="font-medium text-ink-soft">{item.source}</span>
      {item.isoDate && <span>· {relativeTime(item.isoDate)}</span>}
    </div>
  );

  // ── 톱기사 (큰 카드) ──
  if (variant === "lead") {
    return (
      <article className="group">
        <Link href={href} className="block">
          <Thumb
            src={item.image}
            alt={item.title}
            className="aspect-[16/9] w-full rounded-lg"
          />
          <div className="mt-4 space-y-2">
            {meta}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-snug">
              <span className="headline-link">{title}</span>
            </h2>
            {originalTitle && (
              <p className="text-xs text-muted line-clamp-1">{originalTitle}</p>
            )}
            {summary && (
              <p className="text-[15px] leading-relaxed text-ink-soft line-clamp-3">{summary}</p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // ── 컴팩트 (사이드/리스트) ──
  if (variant === "compact") {
    return (
      <article className="group">
        <Link href={href} className="flex gap-3">
          <Thumb
            src={item.image}
            alt={item.title}
            className="h-16 w-16 shrink-0 rounded-md"
          />
          <div className="min-w-0 space-y-1">
            <h3 className="text-sm font-semibold leading-snug line-clamp-2">
              <span className="headline-link">{title}</span>
            </h3>
            {meta}
          </div>
        </Link>
      </article>
    );
  }

  // ── 기본 카드 ──
  return (
    <article className="group">
      <Link href={href} className="block">
        <Thumb src={item.image} alt={item.title} className="aspect-[16/10] w-full rounded-lg" />
        <div className="mt-3 space-y-1.5">
          {meta}
          <h3 className="font-serif text-lg font-bold leading-snug">
            <span className="headline-link">{title}</span>
          </h3>
          {summary && (
            <p className="text-sm leading-relaxed text-ink-soft line-clamp-2">{summary}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
