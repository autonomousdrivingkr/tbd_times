import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "AI 뉴스",
  description: "전세계 인공지능·빅테크·AI 연구 동향을 매일 아침 모아서 정리합니다.",
};

export default function AiPage() {
  return <CategoryView category="ai" />;
}
