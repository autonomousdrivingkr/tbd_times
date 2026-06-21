import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { TOPICS } from "@/lib/topics";

export const dynamic = "force-dynamic";

/**
 * 뉴스 강제 갱신 엔드포인트.
 * - Vercel Cron(매일 06:00 KST)이 호출 → Authorization: Bearer <CRON_SECRET>
 * - 또는 수동 호출 → ?token=<REVALIDATE_TOKEN>
 */
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  const token = process.env.REVALIDATE_TOKEN;
  const provided = req.nextUrl.searchParams.get("token");
  if (token && provided === token) return true;

  // 두 시크릿이 모두 비어 있으면(로컬 개발) 허용
  if (!cronSecret && !token) return true;

  return false;
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  revalidateTag("news");
  const paths = ["/", "/ai", "/investment", "/crypto", ...TOPICS.map((t) => `/topic/${t.slug}`)];
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    ok: true,
    revalidated: ["news", ...paths],
    at: new Date().toISOString(),
  });
}

export const GET = handle;
export const POST = handle;
