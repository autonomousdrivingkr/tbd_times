import type { Category } from "./sources";

// 사이트 상단 섹션 구성.
// - kind "category": 전용 RSS 피드를 가진 카테고리 (getNews(category) 로 수집)
// - kind "topic"   : 전체 뉴스에서 키워드로 필터링하는 섹션 (lib/topics.ts 의 slug)
export interface NavSection {
  label: string;
  href: string;
  kind: "category" | "topic";
  /** category key 또는 topic slug */
  key: string;
  /** 강조 색상 (CSS 변수) */
  accent: string;
  /** 섹션 부제 */
  subtitle: string;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "AI",
    href: "/ai",
    kind: "category",
    key: "ai",
    accent: "var(--color-ai)",
    subtitle: "전세계 인공지능·모델·AI 연구 동향",
  },
  {
    label: "반도체",
    href: "/topic/semiconductor",
    kind: "topic",
    key: "semiconductor",
    accent: "var(--color-ai)",
    subtitle: "엔비디아·TSMC·삼성·SK하이닉스 등 반도체·AI칩",
  },
  {
    label: "투자",
    href: "/investment",
    kind: "category",
    key: "investment",
    accent: "var(--color-invest)",
    subtitle: "증시·금리·코인 등 글로벌 금융 소식",
  },
  {
    label: "빅테크",
    href: "/topic/bigtech",
    kind: "topic",
    key: "bigtech",
    accent: "var(--color-accent)",
    subtitle: "애플·구글·MS·메타·아마존 등 빅테크",
  },
  {
    label: "여행",
    href: "/travel",
    kind: "category",
    key: "travel",
    accent: "var(--color-travel)",
    subtitle: "국내외 여행지·항공·레저 소식",
  },
];

// 상단 섹션으로 승격된 토픽 slug (헤더/홈의 보조 토픽 칩에서 제외)
export const PROMOTED_TOPIC_SLUGS: string[] = NAV_SECTIONS.filter(
  (s) => s.kind === "topic"
).map((s) => s.key);

// (참고) category 섹션이 다루는 카테고리 목록
export const SECTION_CATEGORIES: Category[] = NAV_SECTIONS.filter(
  (s) => s.kind === "category"
).map((s) => s.key as Category);
