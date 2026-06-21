// 키워드 기반 토픽(가상 카테고리).
// 소스 피드와 별개로, 수집된 전체 뉴스에서 키워드로 필터링해 보여준다.
// 한/영 키워드를 함께 넣어 언어에 상관없이 매칭되도록 한다.

import type { NewsItem } from "./rss";

export interface Topic {
  slug: string;
  label: string;
  emoji: string;
  description: string;
  keywords: string[];
}

export const TOPICS: Topic[] = [
  {
    slug: "semiconductor",
    label: "반도체",
    emoji: "🔌",
    description: "엔비디아·TSMC·삼성·SK하이닉스 등 반도체·AI칩 동향",
    keywords: [
      "반도체", "파운드리", "엔비디아", "삼성전자", "하이닉스", "메모리", "웨이퍼",
      "semiconductor", "chip", "chips", "chipmaker", "nvidia", "tsmc", "amd",
      "hbm", "gpu", "wafer", "asml", "foundry", "lithography", "arm holdings",
    ],
  },
  {
    slug: "bigtech",
    label: "빅테크",
    emoji: "🏢",
    description: "애플·구글·MS·메타·아마존·오픈AI 등 빅테크 소식",
    keywords: [
      "애플", "구글", "마이크로소프트", "메타", "아마존", "오픈ai", "엔비디아", "테슬라",
      "apple", "google", "alphabet", "microsoft", "meta", "amazon", "openai",
      "anthropic", "tesla", "nvidia",
    ],
  },
  {
    slug: "fed-rates",
    label: "연준·금리",
    emoji: "🏦",
    description: "미 연준·기준금리·인플레이션 등 거시 이슈",
    keywords: [
      "연준", "금리", "인플레이션", "파월", "기준금리", "물가", "한국은행",
      "federal reserve", "the fed", "interest rate", "rate cut", "rate hike",
      "powell", "inflation", "cpi", "fomc", "treasury yield",
    ],
  },
  {
    slug: "bitcoin",
    label: "비트코인",
    emoji: "₿",
    description: "비트코인·이더리움 가격과 ETF·규제 이슈",
    keywords: [
      "비트코인", "이더리움", "가상자산", "암호화폐", "코인", "etf",
      "bitcoin", "btc", "ethereum", "eth", "crypto", "stablecoin", "solana",
    ],
  },
];

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

function buildRegex(keywords: string[]): RegExp {
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(${escaped.join("|")})`, "i");
}

/** 토픽 키워드로 뉴스 필터링 (제목 + 요약 대상) */
export function filterByTopic(items: NewsItem[], topic: Topic): NewsItem[] {
  const re = buildRegex(topic.keywords);
  return items.filter((it) => re.test(it.title) || re.test(it.summary));
}

/** 자유 검색어로 필터링 (공백 구분 AND 매칭) */
export function searchNews(items: NewsItem[], query: string): NewsItem[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return items.filter((it) => {
    const hay = `${it.title} ${it.summary}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
