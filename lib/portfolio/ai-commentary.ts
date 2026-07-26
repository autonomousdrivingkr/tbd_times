import { unstable_cache } from "next/cache";
import { reserveGeminiSlot, pushBackGeminiSlot, parseRetryDelayMs } from "@/lib/gemini-throttle";

// 사용자의 실제 보유 구성을 바탕으로 Gemini 가 "이 포트폴리오는 이런 특징을
// 가지고 있다"는 관찰형 코멘트를 생성한다. 절대 매수·매도 등 특정 행동을
// 권유하지 않는다 — analysis.ts(뉴스 해설)와 동일하게 이 사이트는 정보
// 제공만 하고 투자 자문을 하지 않는다는 원칙을 그대로 따른다.
//
// 캐싱: 포트폴리오 구성 스냅샷(비중·수익률 등, payload) 자체를 캐시 키로
// 쓰므로 보유 종목이 바뀌면 자동으로 새 코멘트가 생성되고, 구성이 그대로면
// 24시간 동안 재사용된다. payload 에는 절대 금액(원화 자산 총액 등)을 넣지
// 않고 비중(%)·수익률(%) 등 상대값만 담아 외부 API 로 보내는 정보를 최소화한다.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface PortfolioCommentary {
  /** 포트폴리오 전반적인 특징 2~3문장 */
  summary: string;
  /** 이 구성에서 눈에 띄는 장점 2~3개 */
  strengths: string[];
  /** 주의 깊게 볼 만한 점(집중도 등) 2~3개 */
  risks: string[];
}

class CommentaryError extends Error {}

interface HoldingInput {
  name: string;
  pct: number;
  returnPct: number | null;
  dividendYield: number | null;
}

interface CommentaryInput {
  totalReturnPct: number;
  dividendYieldPct: number;
  portfolioCount: number;
  holdingCount: number;
  holdings: HoldingInput[];
}

async function callGemini(payloadJson: string): Promise<PortfolioCommentary | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  let input: CommentaryInput;
  try {
    input = JSON.parse(payloadJson);
  } catch {
    return null;
  }

  const prompt = [
    "당신은 개인 투자자의 포트폴리오 구성을 객관적으로 설명하는 애널리스트입니다.",
    "아래는 사용자가 실제 보유한 자산 구성 데이터(비중·수익률·배당수익률)입니다.",
    "이 데이터만 근거로 코멘트를 작성하세요.",
    "",
    "규칙:",
    "- 절대 특정 종목의 매수·매도·비중 조절을 권유하지 마세요. '~하세요', '~해 보세요' 같은",
    "  행동 지시나 단정적 시장 전망은 금지입니다. 이 코멘트는 투자 자문이 아닙니다.",
    "- 대신 이 구성이 가진 특징(분산 정도, 특정 종목/자산 쏠림, 배당 성향, 현재 손익 현황)을",
    "  객관적으로 설명하세요.",
    "- 주어진 수치 외의 사실(구체적 기업 뉴스·미래 주가 등)을 지어내지 마세요.",
    "- summary: 포트폴리오 전반적인 특징을 2~3문장으로.",
    "- strengths: 이 구성에서 장점으로 볼 수 있는 점 2~3개, 각각 한 문장.",
    "- risks: 주의 깊게 볼 만한 점(쏠림·낮은 분산 등) 2~3개, 각각 한 문장.",
    "- 근거가 부족하면 문장 수를 억지로 채우지 마세요.",
    "- JSON으로만 응답하세요.",
    "",
    "포트폴리오 데이터:",
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
                summary: { type: "STRING" },
                strengths: { type: "ARRAY", items: { type: "STRING" } },
                risks: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["summary", "strengths", "risks"],
            },
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      }
    );
  } catch {
    throw new CommentaryError("gemini fetch failed");
  }
  if (!res.ok) {
    if (res.status === 429) {
      const body = await res.text().catch(() => "");
      pushBackGeminiSlot(parseRetryDelayMs(body));
    }
    throw new CommentaryError(`gemini status ${res.status}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new CommentaryError("gemini empty response");
  let parsed: PortfolioCommentary;
  try {
    parsed = JSON.parse(text) as PortfolioCommentary;
  } catch {
    throw new CommentaryError("gemini bad json");
  }
  if (!parsed.summary || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.risks)) {
    throw new CommentaryError("gemini incomplete");
  }
  return parsed;
}

// 포트폴리오 구성 스냅샷(payload) 단위로 캐싱 — 구성이 바뀌면 새로 생성되고,
// 그대로면 24시간 동안 재사용한다. CommentaryError 는 캐시되지 않아 실패 시
// 다음 방문에서 재시도된다.
const cachedCommentary = unstable_cache(
  async (payloadJson: string) => callGemini(payloadJson),
  ["gemini-portfolio-commentary-v1"],
  { revalidate: 60 * 60 * 24 }
);

interface AssetLike { symbol: string; shares: number; avgCost: number; currency: string }
interface PortfolioLike { assets: AssetLike[] }
interface QuoteLike { price: number; currency: string; dividendYield?: number; name?: string }

function toKRW(amount: number, currency: string, usdKrw: number | null): number {
  if (!isFinite(amount)) return NaN;
  if (currency === "KRW") return amount;
  if (currency === "USD" && usdKrw) return amount * usdKrw;
  return NaN;
}

/**
 * 실제 보유 자산 구성을 집계해 Gemini 로 코멘트를 생성한다(캐시).
 * 보유 종목이 없거나 API 키가 없거나 생성에 실패하면 null(카드 미노출).
 */
export async function getPortfolioCommentary(
  portfolios: PortfolioLike[],
  quotes: Record<string, QuoteLike>,
  usdKrw: number | null
): Promise<PortfolioCommentary | null> {
  interface Agg { name: string; shares: number; cost: number; value: number; dividendYield?: number }
  const map: Record<string, Agg> = {};

  for (const p of portfolios) {
    for (const a of p.assets) {
      const q = quotes[a.symbol];
      const price = q ? toKRW(q.price, q.currency, usdKrw) : NaN;
      const cost = toKRW(a.avgCost, a.currency, usdKrw);
      if (!map[a.symbol]) {
        map[a.symbol] = { name: q?.name ?? a.symbol, shares: 0, cost: 0, value: 0, dividendYield: q?.dividendYield };
      }
      const h = map[a.symbol];
      h.shares += a.shares;
      if (isFinite(cost)) h.cost += cost * a.shares;
      if (isFinite(price)) h.value += price * a.shares;
    }
  }

  const holdings = Object.values(map).sort((a, b) => b.value - a.value);
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const totalCost = holdings.reduce((s, h) => s + h.cost, 0);
  if (holdings.length === 0 || totalValue <= 0) return null;

  const totalReturnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  let annualDividend = 0;
  for (const h of holdings) {
    if (h.dividendYield) annualDividend += h.value * (h.dividendYield / 100);
  }
  const dividendYieldPct = totalValue > 0 ? (annualDividend / totalValue) * 100 : 0;

  const holdingsInput: HoldingInput[] = holdings.slice(0, 10).map((h) => ({
    name: h.name,
    pct: Math.round((h.value / totalValue) * 1000) / 10,
    returnPct: h.cost > 0 ? Math.round(((h.value - h.cost) / h.cost) * 1000) / 10 : null,
    dividendYield: h.dividendYield ? Math.round(h.dividendYield * 100) / 100 : null,
  }));

  const payload: CommentaryInput = {
    totalReturnPct: Math.round(totalReturnPct * 100) / 100,
    dividendYieldPct: Math.round(dividendYieldPct * 100) / 100,
    portfolioCount: portfolios.length,
    holdingCount: holdings.length,
    holdings: holdingsInput,
  };

  try {
    return await cachedCommentary(JSON.stringify(payload));
  } catch {
    return null;
  }
}
