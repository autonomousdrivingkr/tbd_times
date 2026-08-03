// Vercel Web Analytics API로 오늘/최근 방문자 수를 가져와 관리자 페이지에 표시한다.
// - 팀/프로젝트 ID는 비밀이 아니므로 코드에 고정값으로 둔다.
// - VERCEL_ANALYTICS_API_TOKEN(vercel.com/account/tokens 에서 발급)이 없으면
//   null을 반환해 관리자 페이지가 설정 안내만 보여주고 깨지지 않게 한다.
// - Web Analytics 자체가 프로젝트에서 켜져 있고 app/layout.tsx의 <Analytics/> 가
//   실제 방문 트래픽을 수집한 이후부터 데이터가 쌓인다 — 설치 이전 기간은 조회되지 않는다.

const TEAM_ID = "team_j0G8VPP2qtyGeQnqqBGeMNLG";
const PROJECT_ID = "prj_JYHJwLC7JceXtRfyDFA2TEaEDLWm";

export interface VisitorCounts {
  pageviews: number;
  visitors: number;
}

async function queryVisitsCount(since: Date, until: Date): Promise<VisitorCounts | null> {
  const token = process.env.VERCEL_ANALYTICS_API_TOKEN;
  if (!token) return null;

  try {
    const params = new URLSearchParams({
      teamId: TEAM_ID,
      projectId: PROJECT_ID,
      since: since.toISOString(),
      until: until.toISOString(),
    });
    const res = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/count?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[vercel-analytics] status ${res.status}`, body.slice(0, 300));
      return null;
    }
    const json = (await res.json()) as { data?: { pageviews?: number; visitors?: number } };
    return { pageviews: json.data?.pageviews ?? 0, visitors: json.data?.visitors ?? 0 };
  } catch (err) {
    console.error("[vercel-analytics] fetch failed", err);
    return null;
  }
}

// 한국 시간(KST, UTC+9, DST 없음) 기준 하루의 시작/끝을 UTC로 환산한다.
// daysAgo=0이면 오늘, 1이면 어제.
function kstDayBounds(daysAgo: number): { start: Date; end: Date } {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kstNow = new Date(Date.now() + KST_OFFSET_MS);
  const y = kstNow.getUTCFullYear();
  const m = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate() - daysAgo;
  const startUtcMs = Date.UTC(y, m, d, 0, 0, 0) - KST_OFFSET_MS;
  return { start: new Date(startUtcMs), end: new Date(startUtcMs + 24 * 60 * 60 * 1000) };
}

export interface AdminAnalyticsSummary {
  today: VisitorCounts;
  yesterday: VisitorCounts;
  last7Days: VisitorCounts;
}

/** 관리자 페이지용 요약(오늘/어제/최근 7일). 토큰 미설정 등으로 하나라도 실패하면 null. */
export async function getAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary | null> {
  if (!process.env.VERCEL_ANALYTICS_API_TOKEN) return null;

  const todayBounds = kstDayBounds(0);
  const yesterdayBounds = kstDayBounds(1);
  const last7Start = new Date(todayBounds.end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [today, yesterday, last7Days] = await Promise.all([
    queryVisitsCount(todayBounds.start, todayBounds.end),
    queryVisitsCount(yesterdayBounds.start, yesterdayBounds.end),
    queryVisitsCount(last7Start, todayBounds.end),
  ]);

  if (!today || !yesterday || !last7Days) return null;
  return { today, yesterday, last7Days };
}
