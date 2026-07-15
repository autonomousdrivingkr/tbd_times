// 네이버 지역(장소) 검색 API로 전국 맛집 정보를 가져온다.
// - NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 이 없으면 빈 배열(기능 비활성).
// - 지역별 검색어를 순회해 결과를 모으고 중복을 제거한다.
// - 응답은 최대 24시간 캐싱(맛집 정보는 뉴스처럼 자주 바뀌지 않음).

export interface Place {
  /** 상호명 + 도로명주소 기반 중복 제거 키 */
  id: string;
  name: string;
  /** 네이버 category 필드의 마지막 구간 (예: "한식", "카페") */
  category: string;
  description: string;
  address: string;
  roadAddress: string;
  telephone: string;
  /** 검색에 사용된 지역 라벨 (예: "서울 홍대") */
  region: string;
  /** 네이버 지도에서 상호명+주소로 검색하는 링크 */
  mapUrl: string;
  /** 업체 홈페이지 등 네이버가 반환한 링크 (없을 수 있음) */
  link: string;
}

// 검색에 사용할 지역 목록. "지역명 맛집" 형태로 질의한다.
const REGIONS: string[] = [
  "서울 강남 맛집",
  "서울 홍대 맛집",
  "서울 이태원 맛집",
  "서울 성수 맛집",
  "서울 종로 맛집",
  "분당 맛집",
  "판교 맛집",
  "수원 맛집",
  "용인 맛집",
  "동탄 맛집",
  "부산 해운대 맛집",
  "부산 서면 맛집",
  "제주 맛집",
  "강릉 맛집",
  "전주 맛집",
  "대구 맛집",
  "대전 맛집",
  "인천 맛집",
  "경주 맛집",
  "여수 맛집",
  "속초 맛집",
];

interface NaverLocalItem {
  title?: string;
  link?: string;
  category?: string;
  description?: string;
  telephone?: string;
  address?: string;
  roadAddress?: string;
  mapx?: string;
  mapy?: string;
}

// 응답 제목/설명에 포함된 <b> 강조 태그와 HTML 엔티티를 제거한다.
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

function lastCategorySegment(category: string): string {
  const parts = category.split(">").map((s) => s.trim());
  return parts[parts.length - 1] || category;
}

// 네이버 지역 검색은 맛집을 "음식점>양식" 처럼 반환하기도 하지만,
// "한식>육류,고기요리", "뷔페>해산물뷔페" 처럼 상위 분류를 음식 종류로 바로
// 반환하는 경우가 더 많다. "음식점" 포함 여부만 보면 절반 가까이가 누락되므로
// 음식 관련 상위 분류(첫 구간)를 폭넓게 허용한다.
const FOOD_TOP_CATEGORIES = new Set<string>([
  "음식점",
  "한식",
  "중식",
  "일식",
  "양식",
  "분식",
  "아시아음식",
  "퓨전요리",
  "세계음식",
  "치킨",
  "피자",
  "패스트푸드",
  "카페",
  "카페,디저트",
  "제과,베이커리",
  "뷔페",
  "술집",
  "호프,요리주점",
  "바",
]);

function isFoodCategory(category: string): boolean {
  const top = category.split(">")[0]?.trim() ?? "";
  return FOOD_TOP_CATEGORIES.has(top);
}

const SEARCH_REVALIDATE_SECONDS = 60 * 60 * 24;

async function searchRegion(region: string): Promise<Place[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[naver-local] missing NAVER_CLIENT_ID/SECRET env var");
    return [];
  }

  try {
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
      region
    )}&display=5&sort=random`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: SEARCH_REVALIDATE_SECONDS, tags: ["food"] },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[naver-local] status ${res.status} for "${region}"`, body.slice(0, 300));
      return [];
    }
    const data = (await res.json()) as { items?: NaverLocalItem[] };
    const regionLabel = region.replace(/\s*맛집\s*$/, "");

    return (data.items ?? [])
      .filter((it) => it.title && isFoodCategory(it.category ?? ""))
      .map((it): Place => {
        const name = cleanText(it.title!);
        const roadAddress = it.roadAddress ?? "";
        const address = it.address ?? "";
        const mapQuery = `${name} ${roadAddress || address}`.trim();
        return {
          id: `${name}|${roadAddress || address}`,
          name,
          category: lastCategorySegment(it.category ?? "음식점"),
          description: cleanText(it.description ?? ""),
          address,
          roadAddress,
          telephone: it.telephone ?? "",
          region: regionLabel,
          mapUrl: `https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`,
          link: it.link ?? "",
        };
      });
  } catch (err) {
    // 개별 지역 검색 실패는 전체에 영향을 주지 않도록 조용히 무시(로그는 남긴다)
    console.error(`[naver-local] fetch failed for "${region}"`, err);
    return [];
  }
}

function dedupe(places: Place[]): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const p of places) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 지역 요청 사이 최소 간격. 16개를 한꺼번에 병렬 호출하면 네이버 API 의
// 순간 요청 제한(rate limit exceeded)에 걸려 대부분 실패하는 것을 확인했다.
const REQUEST_INTERVAL_MS = 150;

/** 지역 목록을 순회해 전국 맛집 정보를 모아 반환한다. */
export async function getRestaurants(): Promise<Place[]> {
  const results: Place[][] = [];
  for (const region of REGIONS) {
    results.push(await searchRegion(region));
    await sleep(REQUEST_INTERVAL_MS);
  }
  return dedupe(results.flat());
}
