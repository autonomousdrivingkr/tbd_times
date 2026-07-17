import { unstable_cache } from "next/cache";
import type { Place } from "./naver-local";
import { reserveGeminiSlot, pushBackGeminiSlot, parseRetryDelayMs } from "./gemini-throttle";
import { isBuildPhase } from "./build-phase";

// 운동/건강 카드마다 "왜 이 목록에 실렸는지" 짧게 소개하는 글을 Gemini 로 생성한다.
// lib/food-reason.ts와 동일한 구조·제약 원칙(근거 없는 사실 지어내지 않기, 지역 단위
// 배치 호출, 빌드 단계 스킵, 60일 캐싱, 실패 시 조용히 폴백)을 그대로 따른다.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

class ExerciseReasonError extends Error {}

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
    "당신은 지역 운동/헬스 시설 목록을 소개하는 편집자입니다.",
    "아래는 네이버 지역검색으로 찾은 실제 업체 목록입니다. 각 업체마다 '이 목록에 왜",
    "실렸는지'를 한 문장(25~40자)으로 간략히 소개하세요.",
    "",
    "규칙:",
    "- 반드시 주어진 정보(상호명·업종·지역·업체 소개)만 근거로 쓰세요.",
    "- 시설·프로그램·가격·평점·수상 이력·영업시간 등 주어지지 않은 구체적 사실을 절대",
    "  지어내지 마세요. 모든 곳을 최고·1위 같은 표현으로 과장하지 마세요.",
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
    throw new ExerciseReasonError("gemini fetch failed");
  }
  if (!res.ok) {
    if (res.status === 429) {
      const body = await res.text().catch(() => "");
      pushBackGeminiSlot(parseRetryDelayMs(body));
    }
    throw new ExerciseReasonError(`gemini status ${res.status}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ExerciseReasonError("gemini empty response");
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new ExerciseReasonError("gemini bad shape");
    }
    return parsed as Record<string, string>;
  } catch (err) {
    if (err instanceof ExerciseReasonError) throw err;
    throw new ExerciseReasonError("gemini bad json");
  }
}

const cachedRegionReasons = unstable_cache(
  async (payloadJson: string) => callGemini(payloadJson),
  ["gemini-exercise-reason-v1"],
  { revalidate: 60 * 60 * 24 * 60, tags: ["exercise"] }
);

/** 지역 하나의 업체 목록에 대해 "왜 추천됐는지" 짧은 소개를 생성(캐시)해 id별로 반환한다. */
export async function getExerciseReasons(region: string, places: Place[]): Promise<Record<string, string>> {
  if (places.length === 0) return {};

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
    return {};
  }
}
