import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";
import MarketDashboard from "@/components/MarketDashboard";

// 시장 지표를 약 10분 주기로 갱신하기 위해 페이지 revalidate 를 짧게 둔다.
// (뉴스 RSS fetch 는 자체적으로 30분 캐시라 실제 재조회 빈도는 늘지 않는다.)
export const revalidate = 600;

export const metadata: Metadata = {
  title: "투자 뉴스",
  description:
    "미국·한국 증시 지수, 금·유가·금리·환율 등 거시경제 지표 대시보드와 함께 글로벌 증시·금융·시장 소식을 매일 정리합니다.",
};

export default function InvestmentPage() {
  return <CategoryView category="investment" topContent={<MarketDashboard />} />;
}
