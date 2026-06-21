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

async function callGemini(payloadJson: string): Promise<Pair[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  let input: Pair[];
  try {
    input = JSON.parse(payloadJson);
  } catch {
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

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
        // 번역 결과 자체도 6시간 캐시 (이중 안전장치)
        next: { revalidate: 60 * 60 * 6 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 배치(payload) 단위로 캐싱. 동일 헤드라인 묶음은 한 번만 번역된다.
const cachedTranslate = unstable_cache(
  async (payloadJson: string) => callGemini(payloadJson),
  ["gemini-translate-v1"],
  { revalidate: 60 * 60 * 24, tags: ["news"] }
);

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

  const CHUNK = 40;
  for (let start = 0; start < needIdx.length; start += CHUNK) {
    const idxs = needIdx.slice(start, start + CHUNK);
    const payload = idxs.map((i) => ({ t: result[i].title, s: result[i].summary }));
    const translated = await cachedTranslate(JSON.stringify(payload));
    idxs.forEach((i, k) => {
      const tr = translated[k];
      result[i].titleKo = tr?.t?.trim() || result[i].title;
      result[i].summaryKo = tr?.s?.trim() || result[i].summary;
    });
  }

  return result;
}
