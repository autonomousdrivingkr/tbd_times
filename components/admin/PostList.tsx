"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StoredPost } from "@/lib/blog-store";

export default function PostList({ posts }: { posts: StoredPost[] }) {
  const router = useRouter();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const drafts = posts.filter((p) => p.status === "draft");
  const published = posts.filter((p) => p.status === "published");

  async function setStatus(slug: string, status: "draft" | "published") {
    setError(null);
    setBusySlug(slug);
    try {
      const res = await fetch(`/api/admin/blog/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError(`상태 변경 실패 (${slug})`);
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusySlug(null);
    }
  }

  async function remove(slug: string) {
    if (!confirm(`"${slug}" 글을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setError(null);
    setBusySlug(slug);
    try {
      const res = await fetch(`/api/admin/blog/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        setError(`삭제 실패 (${slug})`);
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusySlug(null);
    }
  }

  function Row({ post }: { post: StoredPost }) {
    const busy = busySlug === post.slug;
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            {post.aiGenerated && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
                AI 초안
              </span>
            )}
            <span>{post.date}</span>
            {post.category && <span>· {post.category}</span>}
          </div>
          <p className="mt-1 truncate font-medium text-ink">{post.title}</p>
          <p className="truncate text-xs text-muted">/blog/{post.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {post.status === "published" && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-accent hover:text-accent"
            >
              보기
            </Link>
          )}
          <Link
            href={`/admin/blog/${post.slug}/edit`}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-accent hover:text-accent"
          >
            수정
          </Link>
          {post.status === "draft" ? (
            <button
              disabled={busy}
              onClick={() => setStatus(post.slug, "published")}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              발행
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => setStatus(post.slug, "draft")}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-accent hover:text-accent disabled:opacity-50"
            >
              발행 취소
            </button>
          )}
          <button
            disabled={busy}
            onClick={() => remove(post.slug)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-10">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="font-serif text-lg font-bold">
          검토 대기 중인 초안 {drafts.length > 0 && `(${drafts.length})`}
        </h2>
        {drafts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">검토 대기 중인 초안이 없습니다.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {drafts.map((p) => (
              <Row key={p.slug} post={p} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg font-bold">발행된 글 ({published.length})</h2>
        {published.length === 0 ? (
          <p className="mt-3 text-sm text-muted">발행된 글이 없습니다.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {published.map((p) => (
              <Row key={p.slug} post={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
