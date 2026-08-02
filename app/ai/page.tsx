import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "AI 뉴스",
  description: "전세계 인공지능·빅테크·AI 연구 동향을 매일 아침 모아서 정리합니다.",
  // 외부 RSS 헤드라인·요약을 나열하는 순수 아그리게이션 페이지라, 저가치
  // 콘텐츠로 비치지 않도록 검색 색인에서 제외한다(사이트 링크 이동 목적으로만
  // 유지 — 실제 색인/랭킹은 /briefing·/blog·해설 있는 /news/[slug]가 담당).
  robots: { index: false, follow: true },
};

export default function AiPage() {
  return <CategoryView category="ai" />;
}
