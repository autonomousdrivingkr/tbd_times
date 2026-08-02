import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "운동/건강 뉴스",
  description: "피트니스·러닝 등 운동 트렌드부터 건강 연구·의료 소식까지 국내외 매체 기사를 매일 모아 정리합니다.",
  // 외부 RSS 헤드라인·요약을 나열하는 순수 아그리게이션 페이지라, 저가치
  // 콘텐츠로 비치지 않도록 검색 색인에서 제외한다.
  robots: { index: false, follow: true },
};

export default function ExercisePage() {
  return <CategoryView category="exercise" />;
}
