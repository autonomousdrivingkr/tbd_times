import { unstable_cache } from "next/cache";
import type { NewsItem } from "./rss";

// RSS 에 썸네일이 없는 기사는 기사 페이지의 og:image / twitter:image 메타에서
// 대표 이미지를 가져와 채운다. 결과(이미지 URL 문자열)는 24시간 캐시한다.

const UA =
  "Mozilla/5.0 (compatible; TBDTimesBot/1.0; +https://tbdtimes.vercel.app/about)";

function absolutize(url: string, base: string): string | null {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

function extractMetaImage(html: string, baseUrl: string): string | null {
  // 메타 태그는 <head> 에 있으므로 앞부분만 살핀다.
  const head = html.slice(0, 120_000);
  const patterns: RegExp[] = [
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const re of patterns) {
    const m = head.match(re);
    if (m?.[1]) {
      const abs = absolutize(m[1].trim().replace(/&amp;/gi, "&"), baseUrl);
      if (abs) return abs;
    }
  }
  return null;
}

async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html")) return null;
    const html = await res.text();
    return extractMetaImage(html, articleUrl);
  } catch {
    // 타임아웃·차단 등은 조용히 무시(이미지 없이 표시)
    return null;
  }
}

// 기사 URL 단위로 캐싱. 동일 기사는 하루 한 번만 og:image 를 조회한다.
const cachedOgImage = unstable_cache(fetchOgImage, ["og-image-v1"], {
  revalidate: 60 * 60 * 24,
  tags: ["news"],
});

/**
 * 표시용 items 중 썸네일(image)이 없는 항목을 og:image 로 채워 반환한다.
 * 이미 image 가 있으면 그대로 둔다. 외부 사이트 과부하를 막기 위해 동시 요청을 제한한다.
 */
export async function resolveImages(items: NewsItem[]): Promise<NewsItem[]> {
  const out = items.map((it) => ({ ...it }));
  const need = out.filter((it) => !it.image);
  if (need.length === 0) return out;

  const CONCURRENCY = 6;
  for (let i = 0; i < need.length; i += CONCURRENCY) {
    const batch = need.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (it) => {
        const og = await cachedOgImage(it.link);
        if (og) it.image = og;
      })
    );
  }
  return out;
}
