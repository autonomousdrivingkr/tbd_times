import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthedRequest } from "@/lib/admin-auth";
import { readStore, upsertStoredPost, ensureUniqueSlug, makeSlug, type StoredPost } from "@/lib/blog-store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/** 모든 글(초안 포함)을 최신 생성순으로 반환한다 — 관리자 목록용. */
export async function GET(req: NextRequest) {
  if (!isAuthedRequest(req)) return unauthorized();
  const posts = await readStore(true);
  posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ ok: true, posts });
}

/** 새 글을 만든다(수동 작성). status 를 "published" 로 보내면 즉시 공개된다. */
export async function POST(req: NextRequest) {
  if (!isAuthedRequest(req)) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.markdown !== "string") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const title = body.title.trim();
  const markdown = body.markdown.trim();
  if (!title || !markdown) {
    return NextResponse.json(
      { ok: false, error: "title_and_markdown_required" },
      { status: 400 }
    );
  }

  const date =
    typeof body.date === "string" && body.date ? body.date : new Date().toISOString().slice(0, 10);
  const status: "draft" | "published" = body.status === "published" ? "published" : "draft";
  const requestedSlug =
    typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : makeSlug(title, date);
  const slug = await ensureUniqueSlug(requestedSlug);

  const post: StoredPost = {
    slug,
    title,
    date,
    summary: typeof body.summary === "string" ? body.summary.trim() : "",
    author: typeof body.author === "string" && body.author.trim() ? body.author.trim() : "Tibedra",
    category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : undefined,
    tags: Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : [],
    markdown,
    status,
    createdAt: new Date().toISOString(),
    aiGenerated: false,
  };

  await upsertStoredPost(post);

  if (status === "published") {
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/sitemap.xml");
  }

  return NextResponse.json({ ok: true, post });
}
