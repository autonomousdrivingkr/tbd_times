import { unstable_cache } from "next/cache";
import type { Place } from "./naver-local";
import { generateJson } from "./llm-client";
import { isBuildPhase } from "./build-phase";

// 맛집 카드마다 실제 블로그 후기를 근거로 소개 글을 Gemini 로 생성한다.
// - 네이버 지역검색 API는 평점·리뷰·메뉴 정보를 주지 않아 소개가 늘 부실했다
//   ("이 목록에 왜 실렸는지"만 근거 없이 짧게 지어내는 수준 — 사용자 피드백:
//   정보가 너무 없음). 이제 업체별로 미리 가져온 블로그 후기 발췌
//   (Place.blogPosts, app/food/page.tsx 에서 lib/naver-blog.ts 로 채움)를
//   근거로 써서, 실제 후기에 담긴 메뉴·분위기 등을 반영한 소개를 만든다 —
//   다만 "발췌에 없는 사실은 지어내지 않는다"는 원칙(analysis.ts와 동일)은 그대로 유지.
// - 지역 하나(최대 5곳)를 한 번의 호출로 묶어 처리한다 — 업체 단위로 호출하면
//   지역 수(약 15개) x 업체 수(최대 5개) = 최대 75회 호출이 되어 Gemini
//   분당 한도를 훨씬 넘기고 페이지 응답도 지나치게 느려진다.
// - GEMINI_API_KEY 가 없거나 실패하면 빈 결과(카드는 블로그 링크 + 네이버 자체 설명만 표시).
// - 지역 단위로 60일 캐싱: 업체 목록·블로그 후기는 자주 바뀌지 않으므로 자주 재생성할 필요가 없다.

class FoodReasonError extends Error {}

interface ReasonInput {
  region: string;
  places: {
    id: string;
    name: string;
    category: string;
    description: string;
    blogExcerpts: string[];
  }[];
}

async function callGemini(payloadJson: string): Promise<Record<string, string> | null> {
  let input: ReasonInput;
  try {
    input = JSON.parse(payloadJson);
  } catch {
    return null;
  }
  const withExcerpts = input.places.filter((p) => p.blogExcerpts.length > 0);
  if (withExcerpts.length === 0) return {};

  const prompt = [
    "당신은 지역 맛집 블로그 후기를 요약하는 편집자입니다.",
    "아래는 각 업체와, 그 업체를 다룬 실제 블로그 후기 발췌(blogExcerpts)입니다.",
    "각 업체마다 blogExcerpts 내용을 바탕으로 소개를 1~2문장(60~100자)으로",
    "작성하세요.",
    "",
    "규칙:",
    "- 반드시 blogExcerpts에 실제로 적힌 내용만 근거로 쓰세요. 발췌에 없는",
    "  메뉴·가격·평점·수상 이력을 절대 지어내지 마세요.",
    "- 여러 발췌에서 공통으로 언급되는 내용이 있으면 우선 반영하세요 — 한 사람",
    "  의견보다 신뢰도가 높습니다.",
    "- id를 key로, 소개 문장을 value로 하는 JSON 객체 하나로만 응답하세요.",
    "",
    `지역: ${input.region}`,
    "업체 목록:",
    JSON.stringify(withExcerpts),
  ].join("\n");

  let result;
  try {
    result = await generateJson({
      feature: "food-reason",
      prompt,
      temperature: 0.4,
      geminiTimeoutMs: 25000,
    });
  } catch {
    throw new FoodReasonError("llm request failed");
  }
  if (result.kind === "disabled") return null;

  const parsed = result.data;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new FoodReasonError("gemini bad shape");
  }
  return parsed as Record<string, string>;
}

// 지역(payload) 단위로 캐싱. 같은 지역의 같은 업체·블로그 발췌 조합은 60일에
// 한 번만 생성한다. FoodReasonError 는 캐시되지 않으므로 실패 시 다음
// 재생성 때 다시 시도된다.
const cachedRegionReasons = unstable_cache(
  async (payloadJson: string) => callGemini(payloadJson),
  ["gemini-food-reason-v2"],
  { revalidate: 60 * 60 * 24 * 60, tags: ["food"] }
);

/** 지역 하나의 업체 목록(블로그 후기 포함)에 대해 소개를 생성(캐시)해 id별로 반환한다. */
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
      blogExcerpts: (p.blogPosts ?? []).map((b) => b.description),
    })),
  } satisfies ReasonInput);

  try {
    return (await cachedRegionReasons(payload)) ?? {};
  } catch {
    // 일시적 실패: 이번엔 소개 없이 표시하고 다음 재생성에서 재시도
    return {};
  }
}
