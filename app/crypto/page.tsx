import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "코인 뉴스",
  description: "비트코인·이더리움·블록체인·가상자산 소식을 매일 아침 모아서 정리합니다.",
};

export default function CryptoPage() {
  return <CategoryView category="crypto" />;
}
