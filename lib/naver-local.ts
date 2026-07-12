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

const SEARCH_REVALIDATE_SECONDS = 60 * 60 * 24;

async function searchRegion(region: string): Promise<Place[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

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
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: NaverLocalItem[] };
    const regionLabel = region.replace(/\s*맛집\s*$/, "");

    return (data.items ?? [])
      .filter((it) => it.title && it.category?.includes("음식점"))
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
  } catch {
    // 개별 지역 검색 실패는 전체에 영향을 주지 않도록 조용히 무시
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

/** 지역 목록을 순회해 전국 맛집 정보를 모아 반환한다. */
export async function getRestaurants(): Promise<Place[]> {
  const results = await Promise.all(REGIONS.map(searchRegion));
  return dedupe(results.flat());
}
