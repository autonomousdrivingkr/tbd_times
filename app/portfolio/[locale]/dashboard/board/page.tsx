"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface Post {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; name: string | null };
}

export default function BoardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/portfolio/board");
      if (res.ok) setPosts(await res.json());
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-ink">{t("board.title")}</h1>
        <Link
          href={`/portfolio/${locale}/dashboard/board/new`}
          className="flex items-center gap-2 bg-accent hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("board.write")}
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t("common.loading")}</p>
      ) : posts.length === 0 ? (
        <div className="bg-paper-2 rounded-2xl border border-line p-12 sm:p-16 text-center">
          <div className="w-14 h-14 bg-paper rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <p className="text-ink-soft font-medium mb-1">{t("board.empty")}</p>
          <p className="text-muted text-sm mb-6">{t("board.emptyDesc")}</p>
          <Link
            href={`/portfolio/${locale}/dashboard/board/new`}
            className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
          >
            + {t("board.write")}
          </Link>
        </div>
      ) : (
        <div className="bg-paper-2 rounded-2xl border border-line divide-y divide-line overflow-hidden">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/portfolio/${locale}/dashboard/board/${p.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper transition-colors"
            >
              <span className="font-medium text-ink truncate">{p.title}</span>
              <span className="text-xs text-muted shrink-0">
                {p.author.name ?? "—"} · {new Date(p.createdAt).toLocaleDateString(locale)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
