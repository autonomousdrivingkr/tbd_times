import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getPostSlugs, postDateLabel } from "@/lib/blog";
import AdSlot from "@/components/AdSlot";

// 블로그 글은 저장소의 마크다운 파일 기반이라 빌드 시 전부 정적 생성한다.
export const dynamicParams = false;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "글을 찾을 수 없습니다", robots: { index: false } };
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      url: `${siteUrl}/blog/${slug}`,
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "ko-KR",
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "Tibedra", url: siteUrl },
    mainEntityOfPage: `${siteUrl}/blog/${slug}`,
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="text-sm">
        <Link href="/blog" className="text-accent hover:underline">
          ← 블로그
        </Link>
      </p>

      <header className="mt-4 border-b border-line pb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {post.category && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
              {post.category}
            </span>
          )}
          <time dateTime={post.date}>{postDateLabel(post.date)}</time>
          <span>· {post.readingMinutes}분 읽기</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold leading-tight">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{post.summary}</p>
        )}
        <p className="mt-4 text-sm font-medium text-ink-soft">글 · {post.author}</p>
      </header>

      <article
        className="post-body mt-8"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 광고 */}
      <div className="my-10">
        <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">
          Advertisement
        </p>
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} />
      </div>

      {related.length > 0 && (
        <section className="mt-10 border-t border-line pt-8">
          <h2 className="mb-4 font-serif text-xl font-bold">다른 글</h2>
          <ul className="space-y-4">
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <h3 className="font-serif text-lg font-bold leading-snug">
                    <span className="headline-link">{p.title}</span>
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {postDateLabel(p.date)} · {p.readingMinutes}분 읽기
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
