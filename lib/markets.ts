// 거시경제 대시보드용 시장 데이터 수집.
// - 무료·무인증 Yahoo Finance 차트 엔드포인트를 서버에서 호출한다.
// - 개별 심볼 실패는 조용히 무시하고(부분 렌더), 전체 실패 시 대시보드는 노출되지 않는다.
// - fetch 캐시(revalidate)로 요청마다 재조회하지 않는다.

export type MarketGroup = "us" | "kr" | "macro";

/** 변동 표시 방식: pct=일간 등락률(%), abs=절대 변동(주로 금리 %p) */
type ChangeMode = "pct" | "abs";

interface Ticker {
  symbol: string;
  label: string;
  group: MarketGroup;
  /** 소수 자릿수 */
  digits: number;
  prefix?: string;
  suffix?: string;
  changeMode?: ChangeMode;
  /** 금리 지표(값이 10배로 들어오는 경우 보정) */
  isRate?: boolean;
}

const TICKERS: Ticker[] = [
  // 미국 증시
  { symbol: "^GSPC", label: "S&P 500", group: "us", digits: 2 },
  { symbol: "^IXIC", label: "나스닥", group: "us", digits: 2 },
  { symbol: "^DJI", label: "다우존스", group: "us", digits: 2 },
  // 한국 증시
  { symbol: "^KS11", label: "코스피", group: "kr", digits: 2 },
  { symbol: "^KQ11", label: "코스닥", group: "kr", digits: 2 },
  // 원자재·금리·환율·코인
  { symbol: "GC=F", label: "금", group: "macro", digits: 1, prefix: "$", suffix: "/oz" },
  { symbol: "CL=F", label: "WTI 유가", group: "macro", digits: 2, prefix: "$" },
  { symbol: "^TNX", label: "미 국채 10년", group: "macro", digits: 2, suffix: "%", changeMode: "abs", isRate: true },
  { symbol: "KRW=X", label: "원/달러", group: "macro", digits: 1, suffix: "원" },
  { symbol: "BTC-USD", label: "비트코인", group: "macro", digits: 0, prefix: "$" },
];

export interface Quote {
  symbol: string;
  label: string;
  group: MarketGroup;
  /** 현재가(포맷 전 숫자) */
  price: number;
  /** 전 거래일 대비 절대 변동 */
  change: number;
  /** 전 거래일 대비 등락률(%) */
  changePct: number;
  /** 화면 표시용 포맷된 현재가 */
  priceText: string;
  /** 주 변동 표시 (부호·화살표 제외). 등락률 "1.23%" 또는 금리 "0.04%p" */
  primaryChange: string;
  /** 보조 변동 표시 (절대 변동). 없으면 빈 문자열 */
  secondaryChange: string;
  direction: "up" | "down" | "flat";
}

export const GROUP_LABELS: Record<MarketGroup, string> = {
  us: "미국 증시",
  kr: "한국 증시",
  macro: "원자재·금리·환율",
};

// 시장 지표는 10분 간격으로만 갱신한다(데일리 브리핑 성격).
const REVALIDATE_SECONDS = 60 * 10;

interface YahooMeta {
  symbol?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  /** 최근 정규장 체결 시각(epoch 초) */
  regularMarketTime?: number;
  /** 거래소 표준시 오프셋(초) */
  gmtoffset?: number;
}

interface YahooResult {
  meta?: YahooMeta;
  timestamp?: number[];
  indicators?: { quote?: Array<{ close?: (number | null)[] }> };
}

/**
 * "직전 거래일 종가"를 종가 배열에서 찾는다.
 * chartPreviousClose 는 요청 range 에 따라 기준일이 달라져 신뢰할 수 없으므로,
 * 거래소 현지시간 기준 오늘(=최근 체결일)보다 앞선 마지막 세션의 종가를 사용한다.
 */
function previousSessionClose(r: YahooResult): number | undefined {
  const meta = r.meta;
  const ts = r.timestamp ?? [];
  const closes = r.indicators?.quote?.[0]?.close ?? [];
  if (!meta?.regularMarketTime) return meta?.chartPreviousClose;
  const off = meta.gmtoffset ?? 0;
  const dayOf = (epoch: number) => Math.floor((epoch + off) / 86400);
  const curDay = dayOf(meta.regularMarketTime);
  for (let i = ts.length - 1; i >= 0; i--) {
    const c = closes[i];
    if (typeof c === "number" && dayOf(ts[i]) < curDay) return c;
  }
  return meta.chartPreviousClose;
}

async function fetchQuote(t: Ticker): Promise<Quote | null> {
  try {
    // range=5d 로 최근 거래일들을 받아, 거래소 현지시간 기준 직전 세션 종가 대비 등락을 계산한다.
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      t.symbol
    )}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TibedraBot/1.0; +https://tibedra.com/about)",
        Accept: "application/json, text/plain, */*",
      },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["markets"] },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: { result?: YahooResult[] };
    };
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    if (!result || !meta || typeof meta.regularMarketPrice !== "number") return null;

    let price = meta.regularMarketPrice;
    let prev = previousSessionClose(result);
    if (typeof prev !== "number" || prev === 0) return null;

    // 일부 금리 심볼은 값이 10배(예: 45.6=4.56%)로 들어오므로 보정한다.
    if (t.isRate && price > 20) {
      price /= 10;
      prev /= 10;
    }

    const change = price - prev;
    const changePct = (change / prev) * 100;
    const direction: Quote["direction"] =
      change > 0 ? "up" : change < 0 ? "down" : "flat";

    const fmt = (n: number) =>
      n.toLocaleString("en-US", {
        minimumFractionDigits: t.digits,
        maximumFractionDigits: t.digits,
      });

    const priceText = (t.prefix ?? "") + fmt(price) + (t.suffix ?? "");

    // 금리(abs)는 %p 변동을 주 표시로, 그 외는 등락률(%)을 주 표시로 쓴다.
    const primaryChange =
      t.changeMode === "abs"
        ? `${Math.abs(change).toFixed(t.digits)}%p`
        : `${Math.abs(changePct).toFixed(2)}%`;
    const secondaryChange =
      t.changeMode === "abs" ? "" : fmt(Math.abs(change));

    return {
      symbol: t.symbol,
      label: t.label,
      group: t.group,
      price,
      change,
      changePct,
      priceText,
      primaryChange,
      secondaryChange,
      direction,
    };
  } catch {
    return null;
  }
}

export interface MarketSnapshot {
  quotes: Quote[];
  /** 조회 시각(ISO) */
  fetchedAt: string;
}

/** 대시보드용 시장 스냅샷을 수집해 반환한다. 실패한 심볼은 제외된다. */
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const results = await Promise.all(TICKERS.map(fetchQuote));
  const quotes = results.filter((q): q is Quote => q !== null);
  return { quotes, fetchedAt: new Date().toISOString() };
}
