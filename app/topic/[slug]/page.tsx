import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNews } from "@/lib/rss";
import { translateItems } from "@/lib/translate";
import { TOPICS, getTopic, filterByTopic } from "@/lib/topics";
import { updatedAtLabel } from "@/lib/format";
import NewsFeed from "@/components/NewsFeed";

export const revalidate = 1800;

export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) return { title: "토픽" };
  return {
    title: `${topic.label} 뉴스`,
    description: topic.description,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const all = await getNews();
  const filtered = filterByTopic(all, topic).slice(0, 45);
  const items = await translateItems(filtered);

  return (
    <div className="container-page py-8">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">
          <span className="mr-2">{topic.emoji}</span>
          {topic.label}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {topic.description} · 마지막 업데이트 {updatedAtLabel()}
        </p>
      </header>

      <NewsFeed items={items} showCategory />
    </div>
  );
}
