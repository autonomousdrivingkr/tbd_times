import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getFileSlugs, postDateLabel } from "@/lib/blog";
import AdSlot from "@/components/AdSlot";

// 파일 기반 글은 빌드 시 정적 생성하되, Blob 에서 관리자 발행된 글도 재배포 없이
// 바로 열람 가능해야 하므로 dynamicParams 를 허용하고 ISR 로 갱신한다.
export const dynamicParams = true;
export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function generateStaticParams() {
  return getFileSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
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
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = (await getAllPosts())
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
        {post.aiGenerated && (
          <p className="mt-2 text-xs text-muted">
            AI가 그날의 뉴스를 바탕으로 제안한 초안을 편집장이 검토·수정해 발행했습니다.
          </p>
        )}
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
