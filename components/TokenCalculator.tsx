"use client";

import { useId, useMemo, useState } from "react";

// ── 모델 가격(2026년 기준, 1M 토큰당 USD) ──────────────────────────────
// 각 모델의 실제 공개 요금표를 기준으로 한 스냅샷이며, 프로바이더가 가격을
// 바꾸면 최신 공식 요금표와 다를 수 있다.
interface ModelPricing {
  id: string;
  provider: string;
  name: string;
  /** 1M 입력 토큰당 USD */
  input: number;
  /** 1M 출력 토큰당 USD */
  output: number;
}

const MODELS: ModelPricing[] = [
  { id: "deepseek-v3", provider: "DeepSeek", name: "DeepSeek V3", input: 0.14, output: 0.28 },
  { id: "deepseek-r1", provider: "DeepSeek", name: "DeepSeek R1", input: 0.55, output: 2.19 },
  { id: "gpt-4o", provider: "OpenAI", name: "GPT-4o", input: 2.5, output: 10.0 },
  { id: "gpt-4o-mini", provider: "OpenAI", name: "GPT-4o mini", input: 0.15, output: 0.6 },
  { id: "o3-mini", provider: "OpenAI", name: "o3-mini", input: 1.1, output: 4.4 },
  { id: "claude-3.5-sonnet", provider: "Anthropic", name: "Claude 3.5 Sonnet", input: 3.0, output: 15.0 },
  { id: "claude-3.5-haiku", provider: "Anthropic", name: "Claude 3.5 Haiku", input: 0.8, output: 4.0 },
  { id: "gemini-2.0-flash", provider: "Google", name: "Gemini 2.0 Flash", input: 0.1, output: 0.4 },
  { id: "gemini-1.5-pro", provider: "Google", name: "Gemini 1.5 Pro", input: 1.25, output: 5.0 },
];

const KRW_RATE = 1400;
type Currency = "USD" | "KRW";

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function fmtCost(usd: number, currency: Currency): string {
  if (currency === "KRW") {
    return `₩${Math.round(usd * KRW_RATE).toLocaleString("ko-KR")}`;
  }
  const decimals = usd < 1 ? 4 : usd < 100 ? 2 : 0;
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

// 한국어(한글 음절)는 대부분의 BPE 토크나이저에서 음절 하나가 여러 서브워드
// 토큰으로 쪼개지는 경향이 있어 글자당 토큰 밀도가 영어보다 높다. 아래
// 비율은 공개적으로 자주 인용되는 근사치(영어 약 4자/토큰, 한국어 약
// 1.7자/토큰)이며, 실제 값은 모델별 토크나이저에 따라 달라질 수 있다.
function estimateTokens(text: string): { chars: number; words: number; tokens: number } {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const korean = (text.match(/[가-힣]/g) || []).length;
  const whitespace = (text.match(/\s/g) || []).length;
  const other = Math.max(chars - korean - whitespace, 0);
  const tokens = chars === 0 ? 0 : Math.max(Math.ceil(korean / 1.7 + other / 4), 1);
  return { chars, words, tokens };
}

const MIN_REQ = 100;
const MAX_REQ = 1_000_000;
const SLIDER_MAX = 1000;

function requestsToSlider(v: number): number {
  const minLog = Math.log10(MIN_REQ);
  const maxLog = Math.log10(MAX_REQ);
  const c = clamp(v, MIN_REQ, MAX_REQ);
  return Math.round(((Math.log10(c) - minLog) / (maxLog - minLog)) * SLIDER_MAX);
}
function sliderToRequests(pos: number): number {
  const minLog = Math.log10(MIN_REQ);
  const maxLog = Math.log10(MAX_REQ);
  return Math.round(Math.pow(10, minLog + (pos / SLIDER_MAX) * (maxLog - minLog)));
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 text-center ${
        highlight ? "border-accent/30 bg-accent-soft" : "border-line bg-paper"
      }`}
    >
      <p className="text-[11px] text-muted mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${highlight ? "text-accent" : "text-ink"}`}>{value}</p>
    </div>
  );
}

interface ChartItem {
  id: string;
  name: string;
  monthly: number;
}

// 9개 모델의 월간 비용(단일 지표)을 비교하는 가로 막대 차트. 항목이 이미
// 이름으로 직접 라벨링되므로 카테고리별 색을 따로 쓰지 않고 accent 색
// 하나로 통일하며, 최저 비용 항목만 살짝 구분해 "색만으로" 구분하지 않도록
// 값 라벨을 항상 함께 표시한다.
function CostBarChart({ items, currency }: { items: ChartItem[]; currency: Currency }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const rowH = 34;
  const padTop = 8;
  const padBottom = 8;
  const padRight = 8;
  const labelW = 152;
  const barAreaW = width - labelW - padRight;
  const height = items.length * rowH + padTop + padBottom;
  const maxVal = Math.max(...items.map((i) => i.monthly), 0.0001);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: 480 }}
        role="img"
        aria-label="모델별 예상 월간 비용 비교"
      >
        {items.map((item, i) => {
          const y = padTop + i * rowH;
          const barW = Math.max((item.monthly / maxVal) * barAreaW, 2);
          const isMin = i === 0;
          return (
            <g key={item.id}>
              <text
                x={labelW - 8}
                y={y + rowH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={12}
                fill="var(--color-ink-soft)"
              >
                {item.name}
              </text>
              <rect
                x={labelW}
                y={y + 6}
                width={barW}
                height={rowH - 12}
                rx={4}
                fill={isMin ? "var(--color-accent)" : "var(--color-chart-1)"}
                opacity={hover === null || hover === i ? 1 : 0.5}
                className="transition-opacity duration-150 cursor-pointer"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
              />
              <text
                x={labelW + barW + 6}
                y={y + rowH / 2}
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={hover === i ? 700 : 500}
                fill="var(--color-ink)"
                className="tabular-nums"
              >
                {fmtCost(item.monthly, currency)}
                {isMin && <tspan className="fill-accent"> · 최저</tspan>}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function TokenCalculator() {
  const textareaId = useId();
  const [text, setText] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [dailyRequests, setDailyRequests] = useState(10_000);
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [cachingPct, setCachingPct] = useState(0);

  const { chars, words, tokens } = useMemo(() => estimateTokens(text), [text]);

  const results = useMemo(() => {
    // 프롬프트 캐싱: 캐시 적중 구간의 입력 토큰은 정상 단가의 약 10%로
    // 할인된다는, 여러 프로바이더의 공개 캐싱 요금 사례를 근거로 한 근사치.
    const cachedFactor = 0.1;
    const effectiveInput = inputTokens * (1 - (cachingPct / 100) * (1 - cachedFactor));
    return MODELS.map((m) => {
      const perRequest = (effectiveInput / 1_000_000) * m.input + (outputTokens / 1_000_000) * m.output;
      const daily = perRequest * dailyRequests;
      const monthly = daily * 30;
      return { ...m, perRequest, daily, monthly };
    });
  }, [dailyRequests, inputTokens, outputTokens, cachingPct]);

  const gpt4o = results.find((r) => r.id === "gpt-4o")!;
  const chartItems = useMemo(
    () => [...results].sort((a, b) => a.monthly - b.monthly).map((r) => ({ id: r.id, name: r.name, monthly: r.monthly })),
    [results]
  );
  const ranked = useMemo(() => {
    return [...results]
      .sort((a, b) => a.monthly - b.monthly)
      .map((r) => ({
        ...r,
        savingsPct: gpt4o.monthly > 0 ? ((gpt4o.monthly - r.monthly) / gpt4o.monthly) * 100 : 0,
      }));
  }, [results, gpt4o.monthly]);

  const currencyToggleClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active ? "bg-accent text-white shadow-sm" : "text-muted hover:text-ink-soft"
    }`;

  return (
    <div className="space-y-6">
      {/* 실시간 텍스트 토큰 카운터 */}
      <div className="bg-paper-2 rounded-2xl border border-line p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink-soft mb-4">실시간 텍스트 토큰 카운터</h2>
        <label htmlFor={textareaId} className="sr-only">
          토큰 수를 계산할 텍스트
        </label>
        <textarea
          id={textareaId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="프롬프트나 문서를 붙여넣으면 실시간으로 글자 수·단어 수·예상 토큰 수를 계산합니다..."
          rows={6}
          className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink resize-y focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatBox label="글자 수" value={chars.toLocaleString()} />
          <StatBox label="단어 수" value={words.toLocaleString()} />
          <StatBox label="예상 토큰 수" value={tokens.toLocaleString()} highlight />
        </div>
        {tokens > 0 && (
          <p className="mt-3 text-xs text-muted">
            GPT-4o 입력 기준 예상 비용 약 {fmtCost((tokens / 1_000_000) * gpt4o.input, currency)} · 실제 토큰 수는
            모델별 토크나이저에 따라 달라질 수 있습니다.
          </p>
        )}
      </div>

      {/* 멀티 모델 비용 계산기 */}
      <div className="bg-paper-2 rounded-2xl border border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-sm font-semibold text-ink-soft">멀티 모델 API 비용 계산기</h2>
          <div className="flex bg-paper rounded-xl p-1 gap-1 border border-line">
            {(["USD", "KRW"] as Currency[]).map((c) => (
              <button key={c} onClick={() => setCurrency(c)} className={currencyToggleClass(currency === c)}>
                {c === "USD" ? "$ USD" : "₩ KRW"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-6">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-ink-soft">일일 요청 수</label>
              <input
                type="number"
                min={MIN_REQ}
                max={MAX_REQ}
                value={dailyRequests}
                onChange={(e) => setDailyRequests(clamp(Number(e.target.value) || MIN_REQ, MIN_REQ, MAX_REQ))}
                className="w-28 rounded-lg border border-line bg-paper px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <input
              type="range"
              min={0}
              max={SLIDER_MAX}
              value={requestsToSlider(dailyRequests)}
              onChange={(e) => setDailyRequests(sliderToRequests(Number(e.target.value)))}
              className="w-full"
              style={{ accentColor: "var(--color-accent)" }}
              aria-label="일일 요청 수 (로그 스케일)"
            />
            <div className="flex justify-between text-[11px] text-muted mt-1">
              <span>100</span>
              <span>1만</span>
              <span>10만</span>
              <span>100만</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-ink-soft">프롬프트 캐싱 비율</label>
              <span className="text-sm font-semibold text-accent tabular-nums">{cachingPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={cachingPct}
              onChange={(e) => setCachingPct(Number(e.target.value))}
              className="w-full mt-[9px]"
              style={{ accentColor: "var(--color-accent)" }}
              aria-label="프롬프트 캐싱 비율"
            />
            <div className="flex justify-between text-[11px] text-muted mt-1">
              <span>0% (캐싱 없음)</span>
              <span>90%</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">요청당 평균 입력 토큰</label>
            <input
              type="number"
              min={1}
              max={1_000_000}
              value={inputTokens}
              onChange={(e) => setInputTokens(clamp(Number(e.target.value) || 1, 1, 1_000_000))}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">요청당 평균 출력 토큰</label>
            <input
              type="number"
              min={1}
              max={1_000_000}
              value={outputTokens}
              onChange={(e) => setOutputTokens(clamp(Number(e.target.value) || 1, 1, 1_000_000))}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-ink-soft mb-3">모델별 예상 월간 비용 비교 (일일 {dailyRequests.toLocaleString()}건 기준)</h3>
        <CostBarChart items={chartItems} currency={currency} />

        <h3 className="text-sm font-semibold text-ink-soft mb-3 mt-8">GPT-4o 대비 비용 절감 순위</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="border-b border-line bg-paper">
              <tr className="text-xs uppercase tracking-wide text-muted">
                <th className="text-left px-4 py-3">모델</th>
                <th className="text-left px-4 py-3">제공사</th>
                <th className="text-right px-4 py-3">월간 예상 비용</th>
                <th className="text-right px-4 py-3">GPT-4o 대비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ranked.map((r) => (
                <tr key={r.id} className="hover:bg-paper transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
                  <td className="px-4 py-3 text-muted">{r.provider}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                    {fmtCost(r.monthly, currency)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      r.id === "gpt-4o"
                        ? "text-muted"
                        : r.savingsPct >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {r.id === "gpt-4o" ? "기준" : r.savingsPct >= 0 ? `${r.savingsPct.toFixed(0)}% 절감` : `${Math.abs(r.savingsPct).toFixed(0)}% 더 비쌈`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">
          가격은 각 프로바이더가 공개한 2026년 기준 1M 토큰당 요금이며 실제 청구 금액과 다를 수 있습니다.
          프롬프트 캐싱 절감 효과는 캐시 적중 구간이 정상 입력 단가의 약 10%로 청구된다는 일반적인 사례를
          근거로 한 근사치입니다. USD-KRW 환율은 계산 편의를 위해 ₩{KRW_RATE.toLocaleString("ko-KR")}로
          고정했습니다.
        </p>
      </div>
    </div>
  );
}
