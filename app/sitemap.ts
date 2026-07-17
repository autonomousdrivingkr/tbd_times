import type { MetadataRoute } from "next";
import { getNews } from "@/lib/rss";
import { newsSlug } from "@/lib/slug";
import { listArchivedDates } from "@/lib/briefing-archive";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const main: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/briefing`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/ai`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/investment`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/travel`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/food`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/exercise`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // /topic/[slug] 는 robots noindex 처리된 재분류 페이지라 사이트맵에서 제외한다.

  // 데일리 브리핑 아카이브 (영구 보관된 과거 칼럼)
  const briefingArchive: MetadataRoute.Sitemap = (await listArchivedDates(60)).map((date) => ({
    url: `${base}/briefing/${date}`,
    lastModified: new Date(`${date}T06:00:00+09:00`),
    changeFrequency: "never" as const,
    priority: 0.5,
  }));

  // 현재 피드에 살아 있는 브리핑 상세 페이지 (최신 60건)
  const news: MetadataRoute.Sitemap = (await getNews()).slice(0, 60).map((n) => ({
    url: `${base}/news/${newsSlug(n.link)}`,
    lastModified: n.isoDate ? new Date(n.isoDate) : now,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  // 개인 블로그 글 (사람이 직접 쓴 자체 콘텐츠 + 관리자 발행 Blob 글)
  const blog: MetadataRoute.Sitemap = (await getAllPosts()).map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(`${p.date}T09:00:00+09:00`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...main, ...blog, ...briefingArchive, ...news];
}
