export interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
  marketCap?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  /** 최근 1년 배당 지급 이력(주당 금액) — 월별 배당 차트에 쓴다. */
  dividendEvents?: { date: number; amountPerShare: number }[];
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  assetType: string;
  currency: string;
}

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

const YF_BASE = "https://query1.finance.yahoo.com";
const YF_BASE2 = "https://query2.finance.yahoo.com";

async function yfFetch(path: string, revalidate = 300): Promise<Response> {
  const res = await fetch(`${YF_BASE}${path}`, {
    headers: YF_HEADERS,
    next: { revalidate },
  });
  if (!res.ok) {
    // fallback to query2
    return fetch(`${YF_BASE2}${path}`, {
      headers: YF_HEADERS,
      next: { revalidate },
    });
  }
  return res;
}

async function searchYahooAssets(query: string): Promise<SearchResult[]> {
  try {
    const res = await yfFetch(
      `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false`,
      60
    );
    if (!res.ok) return [];

    const data = await res.json();
    // Yahoo Finance v1 search returns { quotes: [...] } directly
    const quotes: Record<string, string>[] = data?.quotes ?? [];

    return quotes
      .filter((q) => q.quoteType && q.quoteType !== "FUTURE" && q.symbol)
      .slice(0, 8)
      .map((q) => ({
        symbol: q.symbol ?? "",
        name: q.longname ?? q.shortname ?? q.symbol ?? "",
        exchange: q.exchange ?? "",
        assetType: mapQuoteType(q.quoteType ?? ""),
        currency: q.currency ?? "USD",
      }));
  } catch {
    return [];
  }
}

// Yahoo의 검색(/v1/finance/search)은 fuzzy 매칭이라 유효한 티커를 입력해도
// 엉뚱한 동명 해외 상장분을 먼저 보여줄 때가 있다(실측: "SPLG" 검색 시 실제
// NYSEArca 상장 SPLG는 안 나오고 런던거래소의 별개 상품 SPLG.L만 반환).
// 검색과 별개로 입력값 자체가 유효한 심볼인지 차트 엔드포인트로 직접 확인해
// 있으면 결과 맨 앞에 끼워 넣는다 — fuzzy 검색이 놓친 정확한 티커를 구제한다.
async function tryDirectSymbol(query: string): Promise<SearchResult | null> {
  const q = query.trim().toUpperCase();
  if (!/^[A-Z0-9.\-=^]{1,10}$/.test(q)) return null;
  try {
    const res = await yfFetch(`/v8/finance/chart/${encodeURIComponent(q)}?interval=1d&range=1d`, 60);
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") return null;
    return {
      symbol: meta.symbol ?? q,
      name: meta.longName ?? meta.shortName ?? q,
      exchange: meta.exchangeName ?? "",
      assetType: mapQuoteType(meta.instrumentType ?? ""),
      currency: meta.currency ?? "USD",
    };
  } catch {
    return null;
  }
}

interface NaverEtfItem {
  itemcode: string;
  itemname: string;
}

// Yahoo Finance의 검색은 한글 쿼리를 아예 거부하거나(순수 한글은 400 에러) 영문 부분만
// 인식해 국내 ETF(예: "PLUS 고배당주")를 찾지 못한다. 네이버 금융이 전체 국내 ETF
// 목록(이름+코드)을 한 번에 주는 API가 있어, 이걸로 한글 이름 매칭을 보완한다.
async function fetchKoreanEtfList(): Promise<NaverEtfItem[]> {
  try {
    const res = await fetch("https://finance.naver.com/api/sise/etfItemList.naver", {
      headers: { ...YF_HEADERS, Referer: "https://finance.naver.com/sise/etf.naver" },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return [];

    // 이 API는 legacy EUC-KR로 응답한다(Content-Type: text/plain;charset=EUC-KR).
    // res.json()/기본 UTF-8 디코딩으로 읽으면 한글 종목명이 깨져 이름 매칭이 항상 실패한다.
    const buf = await res.arrayBuffer();
    const text = new TextDecoder("euc-kr").decode(buf);
    const data = JSON.parse(text);
    return data?.result?.etfItemList ?? [];
  } catch {
    return [];
  }
}

function matchKoreanEtfs(query: string, list: NaverEtfItem[]): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return list
    .filter((item) => item.itemname.toLowerCase().includes(q))
    .slice(0, 8)
    .map((item) => ({
      // 국내 ETF는 지수 대상과 무관하게 전부 유가증권시장(KOSPI) 세그먼트에 상장되므로
      // Yahoo Finance 심볼은 항상 .KS 접미사를 쓴다(실측 확인: 161510.KS → PLUS 고배당주).
      symbol: `${item.itemcode}.KS`,
      name: item.itemname,
      exchange: "KRX",
      assetType: "ETF",
      currency: "KRW",
    }));
}

export async function searchAssets(query: string): Promise<SearchResult[]> {
  const [yahooResults, koreanEtfList, directMatch] = await Promise.all([
    searchYahooAssets(query),
    fetchKoreanEtfList(),
    tryDirectSymbol(query),
  ]);
  const koreanResults = matchKoreanEtfs(query, koreanEtfList);

  // 심볼 기준 중복 제거. 우선순위: (1) 입력값 그대로 유효한 티커였던 직접 조회
  // 결과 — fuzzy 검색이 놓쳤어도 사용자가 정확히 원했을 가능성이 가장 높다,
  // (2) 한글 이름 매치, (3) Yahoo 검색 결과.
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const r of [...(directMatch ? [directMatch] : []), ...koreanResults, ...yahooResults]) {
    if (seen.has(r.symbol)) continue;
    seen.add(r.symbol);
    merged.push(r);
  }
  return merged.slice(0, 8);
}

// 국내 상장 종목(.KS/.KQ)은 Yahoo Finance가 longName/shortName을 영문으로만
// 준다(예: "Samsung Electronics Co Ltd") — 네이버 증권의 종목 기본정보 API로
// 한글 종목명을 따로 받아온다. 이름은 거의 바뀌지 않으므로 하루 단위로 캐시.
async function getKoreanName(krxCode: string): Promise<string | null> {
  try {
    const res = await fetch(`https://m.stock.naver.com/api/stock/${krxCode}/basic`, {
      headers: YF_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.stockName ?? null;
  } catch {
    return null;
  }
}

export async function getQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const res = await yfFetch(
      // range=1y + events=div: meta.trailingAnnualDividendYield는 v8 chart 응답에
      // 아예 없어(항상 undefined) 실제 배당수익률을 얻으려면 이 방법이 필요하다.
      // 배당수익률을 정식으로 주는 v7/finance/quote·v10/finance/quoteSummary는
      // 현재 crumb 인증 없이는 401(Unauthorized)이라 쓸 수 없다(실측 확인) —
      // 대신 range=1y로 받은 배당 지급 이력을 직접 합산해 trailing 수익률을 계산한다.
      `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y&events=div`,
      300
    );
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? 0;

    // meta.chartPreviousClose는 range=1y일 때 "어제 종가"가 아니라 "1년 전 조회
    // 시작 시점 종가"를 가리킨다(range=1d일 때만 진짜 전일 종가) — 배당수익률
    // 계산을 위해 range=1y로 바꾸면서 함께 어긋난다. 대신 일봉 종가 배열에서
    // 직접 전일 종가를 찾는다: 마지막 종가가 현재가와 사실상 같으면(오늘 장이
    // 마감돼 확정된 종가) 그 앞 값을, 아니면(장중이라 오늘 값이 아직 없음)
    // 마지막 값을 그대로 전일 종가로 쓴다.
    const dailyCloses: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
    const validCloses = dailyCloses.filter((c): c is number => c !== null && isFinite(c));
    let prevClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPreviousClose ?? 0;
    if (validCloses.length >= 2) {
      const lastClose = validCloses[validCloses.length - 1];
      const lastIsToday = price > 0 && Math.abs(lastClose - price) < price * 0.0005;
      prevClose = lastIsToday ? validCloses[validCloses.length - 2] : lastClose;
    }

    const oneYearAgoSec = Date.now() / 1000 - 365 * 24 * 60 * 60;
    const rawDividendEvents: Record<string, { amount: number; date: number }> = result?.events?.dividends ?? {};
    const trailingDividendEvents = Object.values(rawDividendEvents)
      .filter((d) => d.date >= oneYearAgoSec)
      .sort((a, b) => a.date - b.date);
    const trailingDividendPerShare = trailingDividendEvents.reduce((sum, d) => sum + d.amount, 0);
    const dividendYield =
      price > 0 && trailingDividendPerShare > 0 ? (trailingDividendPerShare / price) * 100 : undefined;

    // 국내 상장 종목은 한글명, 그 외(미국 등 해외 종목)는 회사 전체 이름 대신
    // 티커를 그대로 쓴다(예: "Schwab US Dividend Equity ETF" 대신 "SCHD") —
    // 실제로 종목을 식별하는 방식과 더 가깝고 파이차트·보유자산 표에서 훨씬 간결하다.
    const krxMatch = symbol.match(/^(.+)\.(KS|KQ)$/);
    let name: string;
    if (krxMatch) {
      name = (await getKoreanName(krxMatch[1])) ?? meta.longName ?? meta.shortName ?? symbol;
    } else {
      name = meta.symbol ?? symbol;
    }

    return {
      symbol: meta.symbol ?? symbol,
      name,
      price,
      change: price - prevClose,
      changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
      currency: meta.currency ?? "USD",
      exchange: meta.exchangeName ?? "",
      // 퍼센트 값(예: 3.47 = 3.47%)으로 반환한다.
      dividendYield,
      dividendEvents: trailingDividendEvents.map((d) => ({ date: d.date, amountPerShare: d.amount })),
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    };
  } catch {
    return null;
  }
}

export async function getMultipleQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const results: Record<string, QuoteData> = {};
  await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await getQuote(symbol);
      if (quote) results[symbol] = quote;
    })
  );
  return results;
}

function mapQuoteType(type: string): string {
  const map: Record<string, string> = {
    EQUITY: "STOCK",
    ETF: "ETF",
    BOND: "BOND",
    MUTUALFUND: "ETF",
    CRYPTOCURRENCY: "CRYPTO",
  };
  return map[type] ?? "OTHER";
}
