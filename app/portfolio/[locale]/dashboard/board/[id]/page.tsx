"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null };
}

export default function BoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/portfolio/board/${id}`);
      if (res.ok) setPost(await res.json());
      else setNotFound(true);
      setLoading(false);
    })();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/portfolio/board/${id}`, { method: "DELETE" });
    router.push(`/portfolio/${locale}/dashboard/board`);
  }

  if (loading) return <p className="text-sm text-muted">{t("common.loading")}</p>;

  if (notFound || !post) {
    return (
      <div className="bg-paper-2 rounded-2xl border border-line p-12 sm:p-16 text-center">
        <p className="text-ink-soft font-medium mb-1">{t("board.notFound")}</p>
        <p className="text-muted text-sm mb-6">{t("board.notFoundDesc")}</p>
        <Link
          href={`/portfolio/${locale}/dashboard/board`}
          className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
        >
          {t("board.backToList")}
        </Link>
      </div>
    );
  }

  const isAuthor = session?.user?.id === post.author.id;

  return (
    <div>
      <Link
        href={`/portfolio/${locale}/dashboard/board`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink-soft mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t("board.backToList")}
      </Link>

      <div className="bg-paper-2 rounded-2xl border border-line p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-ink">{post.title}</h1>
          {isAuthor && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-muted mb-6">
          {post.author.name ?? "—"} · {new Date(post.createdAt).toLocaleString(locale)}
        </p>
        <div className="h-px bg-line mb-6" />
        <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-paper-2 border border-line rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-ink text-center mb-2">{t("board.deleteConfirmTitle")}</h2>
            <p className="text-sm text-muted text-center mb-6">{t("board.deleteConfirmDesc")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 border border-line text-muted py-3 rounded-xl text-sm font-medium hover:bg-paper hover:text-ink-soft transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {deleting ? t("common.loading") : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
