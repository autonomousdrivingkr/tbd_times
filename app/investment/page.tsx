import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "투자 뉴스",
  description: "글로벌 증시·금융·시장 소식을 매일 아침 모아서 정리합니다.",
};

export default function InvestmentPage() {
  return <CategoryView category="investment" />;
}
