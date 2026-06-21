// 뉴스 소스 정의
// 안정적으로 RSS/Atom 피드를 제공하는 매체 위주로 큐레이션했다 (생존 테스트 통과 피드만).
// 일부 피드는 시간이 지나며 변경될 수 있으므로 수집 단계에서 개별 실패를 허용한다.

export type Category = "ai" | "investment" | "crypto";

export interface Source {
  /** 화면에 표시할 매체명 */
  name: string;
  /** RSS / Atom 피드 URL */
  url: string;
  category: Category;
  /** 한국어 매체 여부 (번역 생략용) */
  ko?: boolean;
}

export const SOURCES: Source[] = [
  // ── AI / 기술 (해외) ──────────────────────────────────
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "ai" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "ai" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "ai" },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "ai" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/technology-lab", category: "ai" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", category: "ai" },
  { name: "Tom's Hardware", url: "https://www.tomshardware.com/feeds/all", category: "ai" },
  { name: "SemiEngineering", url: "https://semiengineering.com/feed/", category: "ai" },
  // ── AI / 기술 (국내) ──────────────────────────────────
  { name: "AI타임스", url: "https://www.aitimes.com/rss/allArticle.xml", category: "ai", ko: true },
  { name: "전자신문", url: "https://rss.etnews.com/Section901.xml", category: "ai", ko: true },
  { name: "ZDNet Korea", url: "https://feeds.feedburner.com/zdkorea", category: "ai", ko: true },
  { name: "IT조선", url: "https://it.chosun.com/rss/allArticle.xml", category: "ai", ko: true },

  // ── 투자 / 금융 (해외) ────────────────────────────────
  { name: "CNBC Top News", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", category: "investment" },
  { name: "CNBC Markets", url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", category: "investment" },
  { name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "investment" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", category: "investment" },
  { name: "Investing.com", url: "https://www.investing.com/rss/news.rss", category: "investment" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com/market_currents.xml", category: "investment" },
  // ── 투자 / 금융 (국내) ────────────────────────────────
  { name: "연합뉴스 경제", url: "https://www.yna.co.kr/rss/economy.xml", category: "investment", ko: true },
  { name: "매일경제 증권", url: "https://www.mk.co.kr/rss/50200011/", category: "investment", ko: true },
  { name: "인포스탁데일리", url: "https://www.infostockdaily.co.kr/rss/allArticle.xml", category: "investment", ko: true },

  // ── 코인 / 가상자산 ───────────────────────────────────
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss", category: "crypto" },
  { name: "Decrypt", url: "https://decrypt.co/feed", category: "crypto" },
  { name: "The Block", url: "https://www.theblock.co/rss.xml", category: "crypto" },
  { name: "토큰포스트", url: "https://www.tokenpost.kr/rss", category: "crypto", ko: true },
  { name: "블록미디어", url: "https://www.blockmedia.co.kr/feed", category: "crypto", ko: true },
];

export const CATEGORIES: Category[] = ["ai", "investment", "crypto"];

export const CATEGORY_LABELS: Record<Category, string> = {
  ai: "AI",
  investment: "투자",
  crypto: "코인",
};

export const CATEGORY_DESC: Record<Category, string> = {
  ai: "전세계 인공지능·빅테크·반도체 동향",
  investment: "글로벌 증시·금융·투자 소식",
  crypto: "비트코인·블록체인·가상자산 뉴스",
};

export const CATEGORY_ACCENT: Record<Category, string> = {
  ai: "var(--color-ai)",
  investment: "var(--color-invest)",
  crypto: "var(--color-crypto)",
};
