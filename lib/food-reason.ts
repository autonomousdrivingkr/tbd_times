import { unstable_cache } from "next/cache";
import type { Place } from "./naver-local";
import { reserveGeminiSlot, pushBackGeminiSlot, parseRetryDelayMs } from "./gemini-throttle";
import { isBuildPhase } from "./build-phase";

// 맛집 카드마다 "왜 이 목록에 실렸는지" 짧게 소개하는 글을 Gemini 로 생성한다.
// - 네이버 지역검색 API는 평점·리뷰·메뉴 정보를 주지 않으므로, 근거 없이
//   특정 메뉴·수상 이력·평점을 지어내지 않도록 프롬프트로 강하게 제약한다
//   (analysis.ts와 동일한 원칙: 부풀린 소개보다 정직하고 짧은 소개가 낫다).
// - 지역 하나(최대 5곳)를 한 번의 호출로 묶어 처리한다 — 업체 단위로 호출하면
//   지역 수(약 15개) x 업체 수(최대 5개) = 최대 75회 호출이 되어 Gemini
//   분당 한도를 훨씬 넘기고 페이지 응답도 지나치게 느려진다.
// - GEMINI_API_KEY 가 없거나 실패하면 빈 결과(카드는 네이버 자체 설명만 표시).
// - 지역 단위로 60일 캐싱: 업체 목록은 자주 바뀌지 않으므로 자주 재생성할 필요가 없다.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

class FoodReasonError extends Error {}

interface ReasonInput {
  region: string;
  places: { id: string; name: string; category: string; description: string }[];
}

async function callGemini(payloadJson: string): Promise<Record<string, string> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  let input: ReasonInput;
  try {
    input = JSON.parse(payloadJson);
  } catch {
    return null;
  }
  if (input.places.length === 0) return {};

  const prompt = [
    "당신은 지역 맛집 목록을 소개하는 편집자입니다.",
    "아래는 네이버 지역검색으로 찾은 실제 업체 목록입니다. 각 업체마다 '이 목록에 왜",
    "실렸는지'를 한 문장(25~40자)으로 간략히 소개하세요.",
    "",
    "규칙:",
    "- 반드시 주어진 정보(상호명·업종·지역·업체 소개)만 근거로 쓰세요.",
    "- 메뉴·가격·평점·수상 이력·영업시간 등 주어지지 않은 구체적 사실을 절대 지어내지",
    "  마세요. 모든 곳을 미슐랭·1위·최고 같은 표현으로 과장하지 마세요.",
    "- 업체 소개(description)가 있으면 그 내용을 우선 반영해 요약하고, 없으면 업종과",
    "  지역 맥락에서 정직하고 담백하게 소개하세요.",
    "- id를 key로, 소개 문장을 value로 하는 JSON 객체 하나로만 응답하세요.",
    "",
    `지역: ${input.region}`,
    "업체 목록:",
    JSON.stringify(input.places),
  ].join("\n");

  await reserveGeminiSlot();

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      }
    );
  } catch {
    throw new FoodReasonError("gemini fetch failed");
  }
  if (!res.ok) {
    if (res.status === 429) {
      const body = await res.text().catch(() => "");
      pushBackGeminiSlot(parseRetryDelayMs(body));
    }
    throw new FoodReasonError(`gemini status ${res.status}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new FoodReasonError("gemini empty response");
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new FoodReasonError("gemini bad shape");
    }
    return parsed as Record<string, string>;
  } catch (err) {
    if (err instanceof FoodReasonError) throw err;
    throw new FoodReasonError("gemini bad json");
  }
}

// 지역(payload) 단위로 캐싱. 같은 지역의 같은 업체 목록은 60일에 한 번만 생성한다.
// FoodReasonError 는 캐시되지 않으므로 실패 시 다음 재생성 때 다시 시도된다.
const cachedRegionReasons = unstable_cache(
  async (payloadJson: string) => callGemini(payloadJson),
  ["gemini-food-reason-v1"],
  { revalidate: 60 * 60 * 24 * 60, tags: ["food"] }
);

/** 지역 하나의 업체 목록에 대해 "왜 추천됐는지" 짧은 소개를 생성(캐시)해 id별로 반환한다. */
export async function getFoodReasons(region: string, places: Place[]): Promise<Record<string, string>> {
  if (places.length === 0) return {};

  // 빌드 단계에서는 생성하지 않는다(캐시도 남기지 않음) → 런타임 ISR 재생성에서 생성.
  if (isBuildPhase()) return {};

  const payload = JSON.stringify({
    region,
    places: places.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
    })),
  } satisfies ReasonInput);

  try {
    return (await cachedRegionReasons(payload)) ?? {};
  } catch {
    // 일시적 실패: 이번엔 소개 없이 표시하고 다음 재생성에서 재시도
    return {};
  }
}
