import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { getAdminAnalyticsSummary } from "@/lib/vercel-analytics";
import LogoutButton from "@/components/admin/LogoutButton";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-2 p-5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default async function AdminHomePage() {
  await requireAdminPage();
  const analytics = await getAdminAnalyticsSummary();

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold">관리자 홈</h1>
          <p className="mt-1 text-sm text-muted">방문자 현황과 사이트 관리 메뉴입니다.</p>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-soft mb-3">방문자 현황</h2>
        {analytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="오늘 방문자"
              value={analytics.today.visitors.toLocaleString("ko-KR")}
              sub={`페이지뷰 ${analytics.today.pageviews.toLocaleString("ko-KR")}`}
            />
            <StatCard
              label="어제 방문자"
              value={analytics.yesterday.visitors.toLocaleString("ko-KR")}
              sub={`페이지뷰 ${analytics.yesterday.pageviews.toLocaleString("ko-KR")}`}
            />
            <StatCard
              label="최근 7일 방문자"
              value={analytics.last7Days.visitors.toLocaleString("ko-KR")}
              sub={`페이지뷰 ${analytics.last7Days.pageviews.toLocaleString("ko-KR")}`}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-paper p-5 text-sm text-muted leading-relaxed">
            방문자 통계가 아직 연결되지 않았습니다. Vercel 프로젝트의 Analytics 탭에서 Web
            Analytics를 켜고, <code className="rounded bg-paper-2 px-1 py-0.5 text-xs">VERCEL_ANALYTICS_API_TOKEN</code>{" "}
            환경변수(vercel.com/account/tokens에서 발급)를 등록하면 이 자리에 오늘/어제/최근 7일
            방문자 수가 표시됩니다. 데이터는 등록 이후 발생하는 방문부터 집계됩니다.
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-soft mb-3">관리 메뉴</h2>
        <Link
          href="/admin/blog"
          className="flex items-center justify-between rounded-2xl border border-line bg-paper-2 p-5 hover:border-accent/40 transition-colors"
        >
          <div>
            <p className="font-semibold text-ink">블로그 관리</p>
            <p className="mt-0.5 text-xs text-muted">자동 생성된 초안을 검토·발행하거나 새 글을 작성합니다</p>
          </div>
          <span className="text-accent">→</span>
        </Link>
      </section>
    </div>
  );
}
