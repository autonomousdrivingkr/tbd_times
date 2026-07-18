// 뉴스 소스 정의
// 안정적으로 RSS/Atom 피드를 제공하는 매체 위주로 큐레이션했다 (생존 테스트 통과 피드만).
// 일부 피드는 시간이 지나며 변경될 수 있으므로 수집 단계에서 개별 실패를 허용한다.

export type Category = "ai" | "investment" | "travel" | "exercise";

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
  // ── 투자 / 금융 (코인·가상자산 통합) ──────────────────
  // 코인·비트코인은 투자 섹션에서 함께 관리한다.
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "investment" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss", category: "investment" },
  { name: "Decrypt", url: "https://decrypt.co/feed", category: "investment" },
  { name: "The Block", url: "https://www.theblock.co/rss.xml", category: "investment" },
  { name: "토큰포스트", url: "https://www.tokenpost.kr/rss", category: "investment", ko: true },
  { name: "블록미디어", url: "https://www.blockmedia.co.kr/feed", category: "investment", ko: true },

  // ── 여행 / 레저 (국내) ────────────────────────────────
  { name: "여행신문", url: "https://www.traveltimes.co.kr/rss/allArticle.xml", category: "travel", ko: true },
  { name: "트래비", url: "https://www.travie.com/rss/allArticle.xml", category: "travel", ko: true },
  { name: "동아일보 여행", url: "https://rss.donga.com/travel.xml", category: "travel", ko: true },
  // ── 여행 / 레저 (해외) ────────────────────────────────
  { name: "Condé Nast Traveler", url: "https://www.cntraveler.com/feed/rss", category: "travel" },
  { name: "Skift", url: "https://skift.com/feed/", category: "travel" },

  // ── 운동 / 건강 (해외) ────────────────────────────────
  { name: "Men's Health", url: "https://www.menshealth.com/rss/all.xml/", category: "exercise" },
  { name: "Runner's World", url: "https://www.runnersworld.com/rss/all.xml/", category: "exercise" },
  { name: "Prevention", url: "https://www.prevention.com/rss/all.xml/", category: "exercise" },
  { name: "ScienceDaily Fitness", url: "https://www.sciencedaily.com/rss/health_medicine/fitness.xml", category: "exercise" },
  // ── 운동 / 건강 (국내) ────────────────────────────────
  { name: "코메디닷컴", url: "https://www.kormedi.com/feed", category: "exercise", ko: true },
  { name: "헬스경향", url: "https://www.k-health.com/rss/allArticle.xml", category: "exercise", ko: true },
  { name: "메디컬투데이", url: "https://www.mdtoday.co.kr/rss/allArticle.xml", category: "exercise", ko: true },
];

export const CATEGORIES: Category[] = ["ai", "investment", "travel", "exercise"];

export const CATEGORY_LABELS: Record<Category, string> = {
  ai: "AI",
  investment: "투자",
  travel: "여행",
  exercise: "운동/건강",
};

export const CATEGORY_DESC: Record<Category, string> = {
  ai: "전세계 인공지능·AI 연구·모델 동향",
  investment: "글로벌 증시·금리·코인 등 금융 소식",
  travel: "국내외 여행지·항공·레저 소식",
  exercise: "운동·피트니스·건강 관리 소식",
};

// 각 카테고리 상단에 표시할 자체 작성 소개 문단(원본 콘텐츠).
export const CATEGORY_INTRO: Record<Category, string> = {
  ai: "인공지능은 이제 기술을 넘어 산업과 일상을 바꾸는 핵심 동력이 되었습니다. Tibedra의 AI 섹션은 글로벌 빅테크의 모델 경쟁과 반도체·인프라 투자, 그리고 국내 AI 산업 동향까지 매일 주요 소식을 모아 정리합니다. 각 기사는 제목과 요약, 원문 링크로 제공되며 해외 기사는 한국어로 자동 번역됩니다.",
  investment:
    "금리와 환율, 기업 실적부터 가상자산까지 — 투자 환경은 매일 빠르게 움직입니다. Tibedra의 투자 섹션은 미국과 한국의 증시·금융·경제는 물론 연준 금리, 비트코인·이더리움 등 코인 시장 소식까지 한곳에 모읍니다. 모든 콘텐츠는 정보 제공 목적이며 투자 권유가 아닙니다.",
  travel:
    "여행은 다시 일상이 되었습니다. Tibedra의 여행 섹션은 국내외 여행지와 항공·호텔, 레저 트렌드 소식을 매일 모아 전합니다. 국내 매체 기사와 함께 해외 매체의 기사는 한국어로 자동 번역해 제공하니, 다음 여행 계획에 참고하세요.",
  exercise:
    "운동과 건강 관리는 매일의 컨디션을 좌우합니다. Tibedra의 운동/건강 섹션은 피트니스·러닝 등 운동 트렌드부터 건강 연구·의료 소식까지 국내외 매체 기사를 모아 전합니다. 해외 매체의 기사는 한국어로 자동 번역해 제공합니다.",
};

export const CATEGORY_ACCENT: Record<Category, string> = {
  ai: "var(--color-ai)",
  investment: "var(--color-invest)",
  travel: "var(--color-travel)",
  exercise: "var(--color-health)",
};
