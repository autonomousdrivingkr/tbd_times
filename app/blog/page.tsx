import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, postDateLabel } from "@/lib/blog";

// Blob 에 새로 발행되는 글(수동 발행·자동 초안 승인)이 재배포 없이 반영되도록 ISR.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "블로그",
  description:
    "Tibedra 편집장이 직접 쓰는 개인 블로그 — AI·기술·투자·여행에 대한 생각과 경험을 기록합니다.",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="container-page max-w-3xl py-12">
      <header className="border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span
            className="h-7 w-1.5 rounded-full"
            style={{ background: "var(--color-accent)" }}
          />
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">블로그</h1>
        </div>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          뉴스 브리핑과 별개로, 편집장이 직접 쓰는 개인 노트입니다. AI·기술·투자·여행을
          현장에서 겪은 그대로, 과장 없이 기록합니다. 자동 수집·번역이 아닌 사람이 직접 쓴
          글입니다.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="py-20 text-center text-muted">아직 발행된 글이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-line">
          {posts.map((post) => (
            <li key={post.slug} className="py-7">
              <article>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  {post.category && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
                      {post.category}
                    </span>
                  )}
                  <time dateTime={post.date}>{postDateLabel(post.date)}</time>
                  <span>· {post.readingMinutes}분 읽기</span>
                </div>
                <h2 className="mt-2 font-serif text-xl sm:text-2xl font-bold leading-snug">
                  <Link href={`/blog/${post.slug}`} className="headline-link">
                    {post.title}
                  </Link>
                </h2>
                {post.summary && (
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft line-clamp-2">
                    {post.summary}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <span className="text-muted">글 · {post.author}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-semibold text-accent hover:underline"
                  >
                    읽기 →
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
