import type { MetadataRoute } from "next";
import { TOPICS } from "@/lib/topics";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const main: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/ai`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/investment`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/crypto`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
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

  return [...main, ...topics];
}
