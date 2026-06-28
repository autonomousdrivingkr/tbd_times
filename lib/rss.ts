import Parser from "rss-parser";
import { SOURCES, type Category, type Source } from "./sources";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  category: Category;
  /** ISO 문자열 (정렬·표시용) */
  isoDate: string | null;
  /** 짧은 요약 (HTML 제거 후 잘라낸 텍스트) */
  summary: string;
  /** 썸네일 이미지 URL (있으면) */
  image: string | null;
  /** 한국어 매체 여부 */
  ko: boolean;
  /** 번역된 한국어 제목 (Gemini, 없으면 undefined) */
  titleKo?: string;
  /** 번역된 한국어 요약 */
  summaryKo?: string;
}

type FeedItem = {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  enclosure?: { url?: string };
  "media:content"?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  "media:thumbnail"?: { $?: { url?: string } };
};

const parser: Parser<unknown, FeedItem> = new Parser({
  timeout: 9000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; TibedraBot/1.0; +https://tibedra.com/about)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
    ],
  },
});

// 피드 결과를 페이지 요청마다 다시 받지 않도록 30분 동안 캐싱한다.
// (아침 Cron 이 /api/revalidate 로 강제 무효화하면 즉시 최신화된다.)
const FEED_REVALIDATE_SECONDS = 60 * 30;

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function extractImage(item: FeedItem): string | null {
  const media = item["media:content"];
  if (Array.isArray(media)) {
    const found = media.find((m) => m?.$?.url)?.$?.url;
    if (found) return found;
  } else if (media?.$?.url) {
    return media.$.url;
  }
  if (item["media:thumbnail"]?.$?.url) return item["media:thumbnail"].$!.url!;
  if (item.enclosure?.url && /\.(jpe?g|png|webp|gif)/i.test(item.enclosure.url)) {
    return item.enclosure.url;
  }
  // 본문 HTML 안의 첫 <img> 시도
  const html = item.content || item.summary || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

async function fetchFeed(source: Source): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TibedraBot/1.0; +https://tibedra.com/about)",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: FEED_REVALIDATE_SECONDS, tags: ["news"] },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const feed = await parser.parseString(xml);

    return (feed.items ?? [])
      .filter((it) => it.title && it.link)
      .map((it): NewsItem => {
        const rawSummary = it.contentSnippet || it.summary || it.content || "";
        return {
          title: stripHtml(it.title ?? "").trim(),
          link: it.link!.trim(),
          source: source.name,
          category: source.category,
          isoDate: it.isoDate ?? (it.pubDate ? new Date(it.pubDate).toISOString() : null),
          summary: truncate(stripHtml(rawSummary)),
          image: extractImage(it),
          ko: source.ko ?? false,
        };
      });
  } catch {
    // 개별 피드 실패는 전체에 영향을 주지 않도록 조용히 무시
    return [];
  }
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    const key = it.title.toLowerCase().replace(/[^a-z0-9가-힣]/gi, "").slice(0, 60);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function sortByDate(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const ta = a.isoDate ? Date.parse(a.isoDate) : 0;
    const tb = b.isoDate ? Date.parse(b.isoDate) : 0;
    return tb - ta;
  });
}

/** 전체 또는 특정 카테고리의 뉴스를 수집·정규화해서 반환 */
export async function getNews(category?: Category): Promise<NewsItem[]> {
  const sources = category ? SOURCES.filter((s) => s.category === category) : SOURCES;
  const results = await Promise.all(sources.map(fetchFeed));
  const merged = results.flat();
  return sortByDate(dedupe(merged));
}
