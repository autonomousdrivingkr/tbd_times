import type { Metadata } from "next";

// 관리자 도구는 검색엔진에 노출되면 안 된다(robots.ts 의 /admin 차단과 이중 방어).
export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper-2">{children}</div>;
}
