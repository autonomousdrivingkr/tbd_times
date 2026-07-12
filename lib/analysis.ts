import { unstable_cache } from "next/cache";
import type { NewsItem } from "./rss";
import { GLOSSARY, GLOSSARY_GROUPS, type Term } from "./glossary";
import { reserveGeminiSlot, pushBackGeminiSlot, parseRetryDelayMs } from "./gemini-throttle";

// 뉴스 브리핑 상세 페이지용 한국어 해설을 Gemini 로 생성한다.
// - 원문 요약을 넘어서 배경·맥락·시사점을 덧붙이는 것이 목적 (자체 콘텐츠).
// - GEMINI_API_KEY 가 없거나 실패하면 null (페이지는 요약만으로 표시).
// - 기사 단위로 7일 캐싱: 같은 기사 해설은 한 번만 생성한다.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface Analysis {
  /** 기사 핵심을 풀어 쓴 도입부 (2~3문장) */
  lead: string;
  /** 배경·맥락 설명 문단 */
  background: string;
  /** 핵심 포인트 3~4개 */
  points: string[];
  /** 왜 중요한가·앞으로 볼 것 문단 */
  outlook: string;
}

// 일시적 실패를 나타내는 오류. 던지면 unstable_cache 가 결과를 저장하지 않아 재시도된다.
class AnalysisError extends Error {}

async function callGemini(payloadJson: string): Promise<Analysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  let input: { title: string; summary: string; source: string };
  try {
    input = JSON.parse(payloadJson);
  } catch {
    return null;
  }

  const prompt = [
    "당신은 한국 독자를 위해 해외·국내 뉴스를 해설하는 편집자입니다.",
    "아래 기사 제목·요약을 바탕으로 뉴스 브리핑 해설을 한국어로 작성하세요.",
    "",
    "규칙:",
    "- lead: 무슨 일이 있었는지 기사 핵심을 풀어 쓴 도입부 2~3문장.",
    "- background: 이 뉴스를 이해하는 데 필요한 배경·맥락 1문단 (4~6문장). 업계 일반 상식 수준의 배경지식은 활용하되, 요약에 없는 구체적 수치·발언을 지어내지 마세요.",
    "- points: 독자가 기억할 핵심 포인트 3~4개. 각각 한 문장.",
    "- outlook: 이 소식이 왜 중요한지, 앞으로 지켜볼 지점 1문단 (3~5문장). 투자 권유·단정적 예측은 금지.",
    "- 기사에 실질적인 근거가 부족하면 문장 수를 억지로 채우지 말고, 확인되지 않은 추측·상투적인 표현으로 메우지 마세요. 짧고 정직한 해설이 부풀린 해설보다 낫습니다.",
    "- 전체적으로 중립적이고 차분한 해설체를 사용하고, 기업명·인물명은 한국에서 통용되는 표기를 쓰세요.",
    "- JSON 으로만 응답하세요.",
    "",
    "기사:",
    JSON.stringify(input),
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
            responseSchema: {
              type: "OBJECT",
              properties: {
                lead: { type: "STRING" },
                background: { type: "STRING" },
                points: { type: "ARRAY", items: { type: "STRING" } },
                outlook: { type: "STRING" },
              },
              required: ["lead", "background", "points", "outlook"],
            },
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      }
    );
  } catch {
    throw new AnalysisError("gemini fetch failed");
  }
  if (!res.ok) {
    if (res.status === 429) {
      const body = await res.text().catch(() => "");
      pushBackGeminiSlot(parseRetryDelayMs(body));
    }
    throw new AnalysisError(`gemini status ${res.status}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new AnalysisError("gemini empty response");
  let parsed: Analysis;
  try {
    parsed = JSON.parse(text) as Analysis;
  } catch {
    throw new AnalysisError("gemini bad json");
  }
  // 스키마상 유효하지 않으면 재시도 대상으로 간주(캐시 방지)
  if (!parsed.lead || !parsed.background || !Array.isArray(parsed.points)) {
    throw new AnalysisError("gemini incomplete");
  }
  return parsed;
}

// 기사(payload) 단위로 캐싱. 같은 기사는 7일에 한 번만 해설을 생성한다.
// AnalysisError 는 캐시되지 않으므로 실패한 해설은 다음 방문 때 재시도된다.
const cachedAnalysis = unstable_cache(
  async (payloadJson: string) => callGemini(payloadJson),
  ["gemini-analysis-v2"],
  { revalidate: 60 * 60 * 24 * 7, tags: ["news"] }
);

// 해설을 생성할 최소 근거 분량. RSS 요약이 사실상 없는 기사까지 4단 해설
// 템플릿을 억지로 채우면 근거 없는 내용을 지어내거나 모든 기사가 똑같이
// 정형화된 "자동 생성물"처럼 보이는 위험이 있어, 이 경우는 아예 생성하지
// 않고 요약만 보여준다(페이지의 폴백 렌더링이 이를 처리).
const MIN_SOURCE_CHARS = 40;

/** 기사 하나에 대한 해설을 생성(캐시)해서 반환한다. 근거가 부족하거나 실패 시 null(요약만 표시). */
export async function getAnalysis(item: NewsItem): Promise<Analysis | null> {
  const summary = item.summaryKo ?? item.summary;
  if (summary.trim().length < MIN_SOURCE_CHARS) return null;

  const payload = JSON.stringify({
    title: item.titleKo ?? item.title,
    summary,
    source: item.source,
  });
  try {
    return await cachedAnalysis(payload);
  } catch {
    // 일시적 실패: 이번엔 해설 없이(요약만) 표시하고 다음 요청에서 재시도
    return null;
  }
}

export interface MatchedTerm extends Term {
  /** 용어사전 페이지의 섹션 앵커 (/glossary#key) */
  group: string;
  groupLabel: string;
}

/**
 * 기사 텍스트에 등장하는 용어사전 용어를 찾아 반환한다 (최대 max개).
 * 한국어 용어는 부분 일치, 영문 약어는 단어 단위 일치로 검사한다.
 */
export function matchGlossaryTerms(text: string, max = 3): MatchedTerm[] {
  const found: MatchedTerm[] = [];
  for (const g of GLOSSARY_GROUPS) {
    for (const t of GLOSSARY[g.key] ?? []) {
      const koHit = text.includes(t.term);
      const enHit =
        t.en && new RegExp(`\\b${t.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
      if (koHit || enHit) {
        found.push({ ...t, group: g.key, groupLabel: g.label });
        if (found.length >= max) return found;
      }
    }
  }
  return found;
}
