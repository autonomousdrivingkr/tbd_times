"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function NewPostPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/portfolio/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      const post = await res.json();
      router.push(`/portfolio/${locale}/dashboard/board/${post.id}`);
      return;
    }
    if (res.status === 422) setError(t("board.blockedError"));
    else setError(t("board.submitError"));
    setSubmitting(false);
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-ink mb-6">{t("board.newPost")}</h1>

      <form onSubmit={handleSubmit} className="bg-paper-2 rounded-2xl border border-line p-6 sm:p-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("board.titleLabel")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("board.titlePlaceholder")}
            required
            autoFocus
            maxLength={200}
            className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("board.contentLabel")}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("board.contentPlaceholder")}
            required
            maxLength={5000}
            rows={10}
            className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-y"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/portfolio/${locale}/dashboard/board`)}
            className="flex-1 border border-line text-muted py-3 rounded-xl text-sm font-medium hover:bg-paper hover:text-ink-soft transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-accent hover:opacity-90 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {submitting ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
