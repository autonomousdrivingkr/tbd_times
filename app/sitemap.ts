import type { MetadataRoute } from "next";
import { TOPICS } from "@/lib/topics";
import { getNews } from "@/lib/rss";
import { newsSlug } from "@/lib/slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const main: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/briefing`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ai`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/investment`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/travel`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const topics: MetadataRoute.Sitemap = TOPICS.map((t) => ({
    url: `${base}/topic/${t.slug}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.7,
  }));

  // 현재 피드에 살아 있는 브리핑 상세 페이지 (최신 60건)
  const news: MetadataRoute.Sitemap = (await getNews()).slice(0, 60).map((n) => ({
    url: `${base}/news/${newsSlug(n.link)}`,
    lastModified: n.isoDate ? new Date(n.isoDate) : now,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...main, ...topics, ...news];
}
