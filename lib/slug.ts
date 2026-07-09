import type { NewsItem } from "./rss";

// 뉴스 원문 링크 → 짧고 안정적인 slug.
// FNV-1a 32bit 해시를 base36 으로 표기한다. 같은 링크는 항상 같은 slug 가 되므로
// 별도 저장소 없이 피드에서 다시 찾을 수 있다.
export function newsSlug(link: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < link.length; i++) {
    h ^= link.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export function newsPath(item: NewsItem): string {
  return `/news/${newsSlug(item.link)}`;
}

export function findBySlug(items: NewsItem[], slug: string): NewsItem | undefined {
  return items.find((it) => newsSlug(it.link) === slug);
}
