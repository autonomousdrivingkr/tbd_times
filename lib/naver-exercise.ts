// 네이버 지역(장소) 검색 API로 전국 운동/건강 시설 정보를 가져온다.
// lib/naver-local.ts(맛집)와 동일한 구조 — 검색·캐싱·중복제거 전략을 그대로 따른다.
// 차이는 검색어와 업종 필터뿐이다.

import type { Place } from "./naver-local";

const REGIONS: string[] = [
  "서울 강남 헬스장",
  "서울 홍대 헬스장",
  "서울 이태원 헬스장",
  "서울 성수 헬스장",
  "서울 종로 헬스장",
  "분당 헬스장",
  "판교 헬스장",
  "수원 헬스장",
  "용인 헬스장",
  "동탄 헬스장",
  "부산 해운대 헬스장",
  "부산 서면 헬스장",
  "제주 헬스장",
  "대구 헬스장",
  "포항 헬스장",
  "경주 헬스장",
];

interface NaverLocalItem {
  title?: string;
  link?: string;
  category?: string;
  description?: string;
  telephone?: string;
  address?: string;
  roadAddress?: string;
}

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

// 네이버 지역검색의 업종 분류 체계를 사전에 실측 확인할 수 없어(운동/건강 카테고리
// 문자열이 맛집의 "음식점" 계열처럼 고정적인지 불확실), 상위 분류 매칭 대신 카테고리
// 문자열 전체에 운동/건강 관련 키워드가 포함되는지로 느슨하게 판별한다 — 오탐 가능성보다
// 실제 헬스장·필라테스·요가 업체를 놓치는 쪽이 더 나쁘다는 판단.
const EXERCISE_KEYWORDS = [
  "헬스",
  "피트니스",
  "필라테스",
  "요가",
  "크로스핏",
  "수영",
  "체육",
  "스포츠",
  "짐",
  "복싱",
  "골프연습장",
  "클라이밍",
  "PT",
];

function isExerciseCategory(category: string): boolean {
  return EXERCISE_KEYWORDS.some((k) => category.includes(k));
}

const SEARCH_REVALIDATE_SECONDS = 60 * 60 * 24;

async function searchRegion(region: string): Promise<Place[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[naver-exercise] missing NAVER_CLIENT_ID/SECRET env var");
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
      next: { revalidate: SEARCH_REVALIDATE_SECONDS, tags: ["exercise"] },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[naver-exercise] status ${res.status} for "${region}"`, body.slice(0, 300));
      return [];
    }
    const data = (await res.json()) as { items?: NaverLocalItem[] };
    const regionLabel = region.replace(/\s*헬스장\s*$/, "");

    return (data.items ?? [])
      .filter((it) => it.title && isExerciseCategory(it.category ?? ""))
      .map((it): Place => {
        const name = cleanText(it.title!);
        const roadAddress = it.roadAddress ?? "";
        const address = it.address ?? "";
        const mapQuery = `${name} ${roadAddress || address}`.trim();
        return {
          id: `${name}|${roadAddress || address}`,
          name,
          category: lastCategorySegment(it.category ?? "스포츠,레저"),
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
    console.error(`[naver-exercise] fetch failed for "${region}"`, err);
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

const REQUEST_INTERVAL_MS = 150;

/** 지역 목록을 순회해 전국 운동/건강 시설 정보를 모아 반환한다. */
export async function getExercisePlaces(): Promise<Place[]> {
  const results: Place[][] = [];
  for (const region of REGIONS) {
    results.push(await searchRegion(region));
    await sleep(REQUEST_INTERVAL_MS);
  }
  return dedupe(results.flat());
}
