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
  const [yahooResults, koreanEtfList] = await Promise.all([
    searchYahooAssets(query),
    fetchKoreanEtfList(),
  ]);
  const koreanResults = matchKoreanEtfs(query, koreanEtfList);

  // 심볼 기준 중복 제거 — 한글 이름 매치를 먼저 보여준다(사용자가 입력한 한글 쿼리와
  // 더 직접적으로 관련 있는 결과이므로).
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const r of [...koreanResults, ...yahooResults]) {
    if (seen.has(r.symbol)) continue;
    seen.add(r.symbol);
    merged.push(r);
  }
  return merged.slice(0, 8);
}

export async function getQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const res = await yfFetch(
      `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      300
    );
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;

    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPreviousClose ?? 0;
    const price = meta.regularMarketPrice ?? 0;

    return {
      symbol: meta.symbol ?? symbol,
      name: meta.longName ?? meta.shortName ?? symbol,
      price,
      change: price - prevClose,
      changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
      currency: meta.currency ?? "USD",
      exchange: meta.exchangeName ?? "",
      dividendYield: meta.trailingAnnualDividendYield,
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
