import Link from "next/link";
import type { Post } from "@/lib/blog";
import { postDateLabel } from "@/lib/blog";
import Thumb from "./Thumb";

export default function BlogSummaryCard({ post }: { post: Post }) {
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        <Thumb src={post.image ?? null} alt={post.title} className="aspect-[16/10] w-full rounded-lg" />
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted">
            {post.category && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
                {post.category}
              </span>
            )}
            <time dateTime={post.date}>{postDateLabel(post.date)}</time>
          </div>
          <h3 className="font-serif text-lg font-bold leading-snug">
            <span className="headline-link">{post.title}</span>
          </h3>
          {post.summary && (
            <p className="text-sm leading-relaxed text-ink-soft line-clamp-2">{post.summary}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
