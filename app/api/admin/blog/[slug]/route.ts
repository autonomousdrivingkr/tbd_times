import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthedRequest } from "@/lib/admin-auth";
import { deleteStoredPost, getStoredPost, upsertStoredPost } from "@/lib/blog-store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function revalidateBlog(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}

/** 글 하나를 읽는다(초안 포함) — 관리자 수정 화면 프리필용. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAuthedRequest(req)) return unauthorized();
  const { slug } = await params;
  const post = await getStoredPost(slug, true);
  if (!post) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, post });
}

/** 글 내용 또는 발행 상태(draft/published)를 수정한다. slug 는 변경할 수 없다. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAuthedRequest(req)) return unauthorized();
  const { slug } = await params;
  const existing = await getStoredPost(slug, true);
  if (!existing) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updated = {
    ...existing,
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : existing.title,
    date: typeof body.date === "string" && body.date ? body.date : existing.date,
    summary: typeof body.summary === "string" ? body.summary.trim() : existing.summary,
    author:
      typeof body.author === "string" && body.author.trim() ? body.author.trim() : existing.author,
    category:
      typeof body.category === "string" ? body.category.trim() || undefined : existing.category,
    tags: Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : existing.tags,
    markdown:
      typeof body.markdown === "string" && body.markdown.trim() ? body.markdown : existing.markdown,
    image: typeof body.image === "string" ? body.image.trim() || undefined : existing.image,
    status:
      body.status === "published" || body.status === "draft" ? body.status : existing.status,
  };

  await upsertStoredPost(updated);
  revalidateBlog(slug);

  return NextResponse.json({ ok: true, post: updated });
}

/** 글을 삭제한다. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAuthedRequest(req)) return unauthorized();
  const { slug } = await params;
  const removed = await deleteStoredPost(slug);
  if (!removed) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  revalidateBlog(slug);
  return NextResponse.json({ ok: true });
}
