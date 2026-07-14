import { getNews } from "./rss";
import { translateItems } from "./translate";
import { reserveGeminiSlot, pushBackGeminiSlot, parseRetryDelayMs } from "./gemini-throttle";

// 매일 자동으로 "편집장 노트" 성격의 블로그 초안을 생성한다.
// - 단순 뉴스 재탕이 아니라 그날 뉴스를 관통하는 흐름·시사점을 짚는 에디토리얼을 목표로 한다.
// - 절대 자동 발행하지 않는다: 결과는 항상 status "draft" 로 저장되고, 관리자가
//   /admin/blog 에서 검토·수정 후 직접 발행 버튼을 눌러야 공개된다(애드센스의 대량
//   자동생성 콘텐츠 정책 위험을 피하기 위한 의도적 설계).

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface GeneratedDraft {
  title: string;
  summary: string;
  category: string;
  tags: string[];
  /** 마크다운 본문 */
  markdown: string;
}

class BlogGenError extends Error {}

export async function generateDailyBlogDraft(): Promise<GeneratedDraft | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const all = await getNews();
  if (all.length === 0) return null;
  const top = await translateItems(all.slice(0, 20));

  const payload = top.map((n, i) => ({
    i,
    t: n.titleKo ?? n.title,
    s: n.summaryKo ?? n.summary,
    cat: n.category,
    src: n.source,
  }));

  const prompt = [
    "당신은 Tibedra 라는 한국어 데일리 브리핑 매체의 편집장입니다.",
    "아래는 오늘 수집된 주요 뉴스 목록(i=인덱스, t=제목, s=요약, cat=분야, src=출처)입니다.",
    "이 뉴스들을 참고해 블로그에 실을 '편집장 노트' 성격의 에디토리얼 글을 한국어로 작성하세요.",
    "",
    "요구사항:",
    "- 개별 뉴스를 그대로 요약·나열하지 말고, 오늘 뉴스들을 관통하는 흐름·패턴·시사점을 편집장",
    "  본인의 시각으로 짚는 글이어야 합니다. 단조로운 사실 리포트가 아니라 관점이 있는 글.",
    "- title: 15~40자, 낚시성 문구 금지.",
    "- summary: 글 목록에 보일 1~2문장 요약.",
    "- category: 이 글과 가장 관련 높은 분야 하나를 'AI', '투자', '여행' 중에서 고르세요.",
    "- tags: 3~5개의 짧은 키워드 배열.",
    "- markdown: 마크다운 본문. ## 소제목 2~4개로 구성하고 전체 700~1200자 분량으로 작성하세요.",
    "- 기사 목록에 없는 사실·수치를 지어내지 마세요.",
    "- 특정 종목·자산에 대한 투자 권유나 단정적 가격 예측은 금지합니다.",
    "- JSON 으로만 응답하세요.",
    "",
    "오늘의 뉴스:",
    JSON.stringify(payload),
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
            temperature: 0.6,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                summary: { type: "STRING" },
                category: { type: "STRING" },
                tags: { type: "ARRAY", items: { type: "STRING" } },
                markdown: { type: "STRING" },
              },
              required: ["title", "summary", "category", "tags", "markdown"],
            },
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      }
    );
  } catch {
    throw new BlogGenError("gemini fetch failed");
  }
  if (!res.ok) {
    if (res.status === 429) {
      const body = await res.text().catch(() => "");
      pushBackGeminiSlot(parseRetryDelayMs(body));
    }
    throw new BlogGenError(`gemini status ${res.status}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new BlogGenError("gemini empty response");
  let parsed: GeneratedDraft;
  try {
    parsed = JSON.parse(text) as GeneratedDraft;
  } catch {
    throw new BlogGenError("gemini bad json");
  }
  if (!parsed.title || !parsed.markdown) throw new BlogGenError("gemini incomplete");
  return parsed;
}
