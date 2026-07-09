import { unstable_cache } from "next/cache";
import { getNews, type NewsItem } from "./rss";
import { translateItems } from "./translate";
import { newsPath } from "./slug";

// 데일리 브리핑 칼럼: 오늘의 주요 뉴스를 3가지 테마로 묶어 해설하는 자체 에디토리얼.
// KST 날짜 단위로 캐싱되어 하루 한 번만 생성된다 (아침 Cron 의 tag 무효화 시 재생성).

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface BriefingRef {
  title: string;
  path: string;
  source: string;
}

export interface BriefingSection {
  title: string;
  body: string;
  items: BriefingRef[];
}

export interface DailyBriefing {
  /** KST 날짜 (YYYY-MM-DD) */
  date: string;
  headline: string;
  intro: string;
  sections: BriefingSection[];
  closing: string;
}

/** KST 기준 오늘 날짜 (YYYY-MM-DD) */
export function kstDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

interface RawBriefing {
  headline: string;
  intro: string;
  sections: { title: string; body: string; refs: number[] }[];
  closing: string;
}

async function callGemini(
  items: { i: number; t: string; s: string; src: string }[]
): Promise<RawBriefing | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    "당신은 한국 독자를 위한 아침 뉴스레터 편집자입니다.",
    "아래 오늘의 주요 기사 목록(i=인덱스, t=제목, s=요약, src=출처)을 읽고 '오늘의 브리핑' 칼럼을 한국어로 작성하세요.",
    "",
    "규칙:",
    "- headline: 오늘 하루를 관통하는 브리핑 제목 (15~30자, 낚시성 금지).",
    "- intro: 오늘의 흐름을 요약하는 도입 2~3문장.",
    "- sections: 가장 중요한 테마 3개. 각 테마는 title(짧은 소제목), body(관련 기사들을 엮어 해설하는 4~6문장), refs(참고한 기사 인덱스 1~3개).",
    "- closing: 독자에게 건네는 마무리 1~2문장.",
    "- 기사 목록에 없는 사실·수치를 지어내지 마세요. 투자 권유·단정적 예측은 금지.",
    "- 중립적이고 차분한 해설체를 사용하세요.",
    "- JSON 으로만 응답하세요.",
    "",
    "기사 목록:",
    JSON.stringify(items),
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
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                headline: { type: "STRING" },
                intro: { type: "STRING" },
                sections: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      body: { type: "STRING" },
                      refs: { type: "ARRAY", items: { type: "INTEGER" } },
                    },
                    required: ["title", "body", "refs"],
                  },
                },
                closing: { type: "STRING" },
              },
              required: ["headline", "intro", "sections", "closing"],
            },
          },
        }),
        cache: "no-store", // 캐싱은 바깥 unstable_cache 가 담당
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text) as RawBriefing;
    if (!parsed.headline || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function buildBriefing(dateKey: string): Promise<DailyBriefing | null> {
  const all = await getNews();
  if (all.length === 0) return null;
  const top = await translateItems(all.slice(0, 18));

  const payload = top.map((n, i) => ({
    i,
    t: n.titleKo ?? n.title,
    s: n.summaryKo ?? n.summary,
    src: n.source,
  }));

  const raw = await callGemini(payload);
  if (!raw) return null;

  const toRef = (idx: number): BriefingRef | null => {
    const it: NewsItem | undefined = top[idx];
    if (!it) return null;
    return { title: it.titleKo ?? it.title, path: newsPath(it), source: it.source };
  };

  return {
    date: dateKey,
    headline: raw.headline,
    intro: raw.intro,
    sections: raw.sections.slice(0, 3).map((s) => ({
      title: s.title,
      body: s.body,
      items: (s.refs ?? []).map(toRef).filter(Boolean).slice(0, 3) as BriefingRef[],
    })),
    closing: raw.closing,
  };
}

// 날짜 키 단위 캐싱: 같은 날은 한 번만 생성. 아침 Cron(tag "news")이 무효화하면
// 그날 첫 방문 때 최신 피드로 다시 생성된다.
const cachedBriefing = unstable_cache(buildBriefing, ["daily-briefing-v1"], {
  revalidate: 60 * 60 * 24,
  tags: ["news"],
});

/** 오늘(KST)의 데일리 브리핑을 반환한다. 생성 실패 시 null. */
export function getDailyBriefing(): Promise<DailyBriefing | null> {
  return cachedBriefing(kstDateKey());
}
