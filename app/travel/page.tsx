import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "여행 뉴스",
  description: "국내외 여행지·항공·호텔·레저 소식을 매일 아침 모아서 정리합니다.",
};

export default function TravelPage() {
  return <CategoryView category="travel" />;
}
