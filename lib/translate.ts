import { unstable_cache } from "next/cache";
import type { NewsItem } from "./rss";

// Google Gemini API 로 해외 기사 제목/요약을 한국어로 번역한다.
// - GEMINI_API_KEY 가 없으면 원문을 그대로 사용(기능 비활성).
// - 동일한 배치는 unstable_cache 로 캐싱해 재생성마다 재호출하지 않는다.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function hasHangul(text: string): boolean {
  return /[가-힣]/.test(text);
}

interface Pair {
  t: string;
  s: string;
}

// 일시적 실패(네트워크·API 오류)를 나타내는 오류.
// callGemini 가 이 오류를 던지면 unstable_cache 가 결과를 저장하지 않아
// 다음 요청에서 자동으로 재시도된다(빈 번역이 캐시에 눌러앉는 문제 방지).
class TranslateError extends Error {}

async function callGemini(payloadJson: string): Promise<Pair[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  let input: Pair[];
  try {
    input = JSON.parse(payloadJson);
  } catch {
    // 입력 자체가 잘못된 경우는 재시도해도 소용없으므로 빈 결과(캐시 허용)
    return [];
  }

  const prompt = [
    "다음은 해외 뉴스의 제목(t)과 요약(s) 목록입니다.",
    "각 항목을 자연스럽고 간결한 한국어로 번역하세요.",
    "- 기업명·인물명·티커 등 고유명사는 한국에서 통용되는 표기를 사용하고, 모호하면 영문을 병기하세요.",
    "- 의미를 더하거나 빼지 말고 번역만 하세요. 요약이 비어 있으면 빈 문자열을 반환하세요.",
    "- 입력과 동일한 순서/개수의 JSON 배열로만 응답하세요.",
    "",
    "입력:",
    JSON.stringify(input),
  ].join("\n");

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // 이미 공개된 뉴스 원문을 그대로 옮기는 번역 작업이므로, 전쟁·사건사고 등
          // 민감한 소재의 기사가 안전 필터에 막혀 배치 전체가 영어로 남는 것을 방지한다.
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { t: { type: "STRING" }, s: { type: "STRING" } },
                required: ["t", "s"],
              },
            },
          },
        }),
        // 캐싱은 바깥 unstable_cache 가 전담(성공 결과만 저장). 실패 응답이
        // Next fetch 캐시에 눌러앉지 않도록 여기서는 캐시하지 않는다.
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      }
    );
  } catch {
    // 네트워크 오류·타임아웃 → 재시도 대상
    throw new TranslateError("gemini fetch failed");
  }
  if (!res.ok) throw new TranslateError(`gemini status ${res.status}`);
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new TranslateError("gemini empty response");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new TranslateError("gemini bad json");
  }
  if (!Array.isArray(parsed)) throw new TranslateError("gemini bad shape");
  return parsed as Pair[];
}

// 배치(payload) 단위로 캐싱. 동일 헤드라인 묶음은 한 번만 번역된다.
// callGemini 가 던지는 TranslateError 는 캐시되지 않으므로 실패 배치는 자동 재시도된다.
const cachedTranslate = unstable_cache(
  async (payloadJson: string) => callGemini(payloadJson),
  ["gemini-translate-v2"],
  { revalidate: 60 * 60 * 24, tags: ["news"] }
);

// 실패한 배치는 이번 요청에서 원문을 유지하되 캐시에 저장하지 않는다(다음 재생성 때 재시도).
// 일시적 오류를 한 번 더 즉시 재시도해 사용자에게 영어가 노출될 확률을 줄인다.
async function translateBatch(payloadJson: string): Promise<Pair[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await cachedTranslate(payloadJson);
    } catch {
      /* 다음 시도 */
    }
  }
  return [];
}

/**
 * 표시용 items 에 한국어 제목(titleKo)·요약(summaryKo)을 채워 반환한다.
 * 이미 한국어인 항목은 API 호출 없이 원문을 그대로 사용한다.
 */
export async function translateItems(items: NewsItem[]): Promise<NewsItem[]> {
  const result = items.map((it) => ({ ...it }));
  const needIdx: number[] = [];

  result.forEach((it, idx) => {
    if (it.ko || hasHangul(it.title)) {
      it.titleKo = it.title;
      it.summaryKo = it.summary;
    } else {
      needIdx.push(idx);
    }
  });

  if (needIdx.length === 0) return result;

  // API 키가 없으면 원문 유지(번역 없이 표시)
  if (!process.env.GEMINI_API_KEY) {
    needIdx.forEach((i) => {
      result[i].titleKo = result[i].title;
      result[i].summaryKo = result[i].summary;
    });
    return result;
  }

  // 배치가 크면 Gemini 응답이 느려/실패해 통째로 영어로 남을 위험이 크다.
  // 20개 단위로 나눠 실패 영향 범위를 줄이고, 배치들을 병렬 처리한다.
  const CHUNK = 20;
  const batches: number[][] = [];
  for (let start = 0; start < needIdx.length; start += CHUNK) {
    batches.push(needIdx.slice(start, start + CHUNK));
  }

  await Promise.all(batches.map((idxs) => translateIndices(idxs, result)));

  return result;
}

/**
 * 인덱스 묶음을 번역한다. 실패(개수 불일치 포함) 시 절반씩 나눠 재귀 재시도해
 * 안전 필터 등으로 문제를 일으키는 항목만 격리한다 — 배치 안의 다른 기사들까지
 * 통째로 영어로 남는 것을 막기 위함이다. 더 나눌 수 없는 단일 항목이 끝까지
 * 실패하면 그 기사만 원문을 유지한다.
 */
async function translateIndices(idxs: number[], result: NewsItem[]): Promise<void> {
  const payload = idxs.map((i) => ({ t: result[i].title, s: result[i].summary }));
  const translated = await translateBatch(JSON.stringify(payload));

  if (translated.length === idxs.length) {
    idxs.forEach((i, k) => {
      const tr = translated[k];
      result[i].titleKo = tr?.t?.trim() || result[i].title;
      result[i].summaryKo = tr?.s?.trim() || result[i].summary;
    });
    return;
  }

  if (idxs.length === 1) {
    result[idxs[0]].titleKo = result[idxs[0]].title;
    result[idxs[0]].summaryKo = result[idxs[0]].summary;
    return;
  }

  const mid = Math.ceil(idxs.length / 2);
  await Promise.all([
    translateIndices(idxs.slice(0, mid), result),
    translateIndices(idxs.slice(mid), result),
  ]);
}
