"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Thumb from "@/components/Thumb";

export interface PostFormInitial {
  slug: string;
  title: string;
  date: string;
  summary: string;
  author: string;
  category?: string;
  tags: string[];
  markdown: string;
  image?: string;
  status: "draft" | "published";
  aiGenerated?: boolean;
}

export default function PostForm({
  mode,
  initial,
}: {
  mode: "new" | "edit";
  initial?: PostFormInitial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "Derek Ji");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [markdown, setMarkdown] = useState(initial?.markdown ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "published" | null>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 선택해도 onChange 가 발생하도록 초기화
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/blog/upload-image", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const messages: Record<string, string> = {
          unsupported_type: "지원하지 않는 이미지 형식입니다(JPG/PNG/WEBP/GIF만 가능).",
          file_too_large: "파일이 너무 큽니다(최대 8MB).",
          image_store_not_configured: "이미지 저장소가 설정되어 있지 않습니다.",
        };
        setUploadError(messages[data.error] ?? "업로드에 실패했습니다.");
        return;
      }
      setImage(data.url);
    } catch {
      setUploadError("네트워크 오류로 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(status: "draft" | "published") {
    setError(null);
    if (!title.trim() || !markdown.trim()) {
      setError("제목과 본문은 필수입니다.");
      return;
    }
    setSaving(status);
    try {
      const body = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        date,
        summary: summary.trim(),
        author: author.trim(),
        category: category.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        markdown,
        image: image.trim() || undefined,
        status,
      };

      const res =
        mode === "new"
          ? await fetch("/api/admin/blog", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch(`/api/admin/blog/${initial!.slug}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(`저장 실패: ${data.error ?? res.status}`);
        return;
      }

      router.push("/admin/blog");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(null);
    }
  }

  const inputClass =
    "w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent";
  const labelClass = "mb-1 block text-sm font-medium text-ink-soft";

  return (
    <div className="space-y-5">
      {initial?.aiGenerated && (
        <p className="rounded-md bg-accent-soft px-3 py-2 text-xs text-accent">
          매일 자동 생성된 초안입니다. 내용을 검토·수정한 뒤 발행하세요.
        </p>
      )}

      <div>
        <label className={labelClass}>제목</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="글 제목"
        />
      </div>

      {mode === "new" ? (
        <div>
          <label className={labelClass}>slug (URL, 비워두면 자동 생성)</label>
          <input
            className={inputClass}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="예: my-post-title"
          />
        </div>
      ) : (
        <div>
          <label className={labelClass}>slug</label>
          <input className={inputClass} value={initial?.slug ?? ""} disabled />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>날짜</label>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>분야</label>
          <input
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="AI / 투자 / 여행"
          />
        </div>
        <div>
          <label className={labelClass}>글쓴이</label>
          <input
            className={inputClass}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>요약 (목록에 보일 1~2문장)</label>
        <textarea
          className={inputClass}
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>대표 이미지 (목록·상세에 표시, 선택)</label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent">
            {uploading ? "업로드 중..." : "이미지 첨부"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={onFileSelected}
            />
          </label>
          <span className="text-xs text-muted">또는 아래에 이미지 URL을 직접 입력하세요.</span>
        </div>
        <input
          className={`${inputClass} mt-2`}
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://..."
        />
        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
        {image.trim() && (
          <Thumb
            src={image.trim()}
            alt="대표 이미지 미리보기"
            className="mt-2 aspect-[16/9] w-full max-w-sm rounded-lg"
          />
        )}
      </div>

      <div>
        <label className={labelClass}>태그 (쉼표로 구분)</label>
        <input
          className={inputClass}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="AI, 개발, 생산성"
        />
      </div>

      <div>
        <label className={labelClass}>본문 (마크다운)</label>
        <textarea
          className={`${inputClass} font-mono`}
          rows={20}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="## 소제목&#10;&#10;본문 내용..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => submit("draft")}
          disabled={saving !== null}
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {saving === "draft" ? "저장 중..." : "임시저장 (초안)"}
        </button>
        <button
          type="button"
          onClick={() => submit("published")}
          disabled={saving !== null}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving === "published" ? "발행 중..." : "발행하기"}
        </button>
      </div>
    </div>
  );
}
