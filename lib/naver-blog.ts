// 네이버 블로그 검색 API로 맛집 관련 블로그 후기를 가져온다.
// - lib/naver-local.ts 와 동일한 자격증명(NAVER_CLIENT_ID/SECRET)을 그대로 쓴다 —
//   네이버 개발자센터의 "검색" API는 지역/블로그 검색이 같은 앱 등록으로 커버되므로
//   별도 키 발급이 필요 없다.
// - 결과는 60일간 캐싱(Next 데이터 캐시, food 태그) — 맛집 블로그 후기는 뉴스처럼
//   자주 바뀌지 않는다.

export interface BlogRef {
  title: string;
  description: string;
  bloggerName: string;
  link: string;
}

interface NaverBlogItem {
  title?: string;
  link?: string;
  description?: string;
  bloggername?: string;
}

// 네이버 검색 API 응답 제목/설명에 포함된 <b> 강조 태그와 HTML 엔티티를 제거한다.
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

const BLOG_CACHE_SECONDS = 60 * 60 * 24 * 60;

/** 업체명 + 지역으로 네이버 블로그를 검색해 관련도(sim)순 상위 글을 반환한다. */
export async function searchBlogPosts(name: string, region: string): Promise<BlogRef[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  try {
    const query = `${name} ${region}`;
    const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(
      query
    )}&display=3&sort=sim`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: BLOG_CACHE_SECONDS, tags: ["food"] },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[naver-blog] status ${res.status} for "${query}"`, body.slice(0, 300));
      return [];
    }
    const data = (await res.json()) as { items?: NaverBlogItem[] };
    return (data.items ?? [])
      .filter((it) => it.title && it.description)
      .map((it): BlogRef => ({
        title: cleanText(it.title!),
        description: cleanText(it.description ?? ""),
        bloggerName: it.bloggername ?? "",
        link: it.link ?? "",
      }));
  } catch (err) {
    console.error(`[naver-blog] fetch failed for "${name} ${region}"`, err);
    return [];
  }
}
