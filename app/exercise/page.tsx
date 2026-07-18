import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "운동/건강 뉴스",
  description: "피트니스·러닝 등 운동 트렌드부터 건강 연구·의료 소식까지 국내외 매체 기사를 매일 모아 정리합니다.",
};

export default function ExercisePage() {
  return <CategoryView category="exercise" />;
}
