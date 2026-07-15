import { NextRequest, NextResponse } from "next/server";
import { generateDailyBlogDraft } from "@/lib/blog-generator";
import {
  readStore,
  upsertStoredPost,
  ensureUniqueSlug,
  makeSlug,
  hasBlobStore,
  type StoredPost,
} from "@/lib/blog-store";
import { kstDateKey } from "@/lib/briefing";

// 매일 뉴스 기반 블로그 초안을 하나 생성한다. 절대 자동 발행하지 않고 항상
// status:"draft" 로 저장되며, 관리자가 /admin/blog 에서 검토 후 발행해야 공개된다.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  if (!hasBlobStore()) {
    return NextResponse.json({ ok: false, skipped: "no_blob_store" });
  }

  const dateKey = kstDateKey();

  // 같은 날짜의 자동 초안이 이미 있으면 중복 생성하지 않는다(재시도·중복 호출 대비).
  const existing = await readStore(true);
  const already = existing.find((p) => p.date === dateKey && p.aiGenerated);
  if (already) {
    return NextResponse.json({ ok: true, skipped: "already_generated", slug: already.slug });
  }

  let draft;
  try {
    draft = await generateDailyBlogDraft();
  } catch (err) {
    console.error("[cron/blog] generation failed", err);
    return NextResponse.json({ ok: false, error: "generation_failed" }, { status: 502 });
  }

  if (!draft) {
    return NextResponse.json({ ok: false, skipped: "gemini_unavailable" });
  }

  const slug = await ensureUniqueSlug(makeSlug(draft.title, dateKey));
  const post: StoredPost = {
    slug,
    title: draft.title,
    date: dateKey,
    summary: draft.summary,
    author: "Tibedra 편집팀",
    category: draft.category,
    tags: draft.tags,
    markdown: draft.markdown,
    image: draft.image,
    status: "draft",
    createdAt: new Date().toISOString(),
    aiGenerated: true,
  };

  await upsertStoredPost(post);

  return NextResponse.json({ ok: true, created: slug });
}

export const GET = handle;
export const POST = handle;
