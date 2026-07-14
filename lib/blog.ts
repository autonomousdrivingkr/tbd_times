import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { readStore, type StoredPost } from "./blog-store";

// 블로그 글은 두 소스를 합쳐서 보여준다.
// 1) 저장소 마크다운 파일(content/blog/*.md) — git push 로 발행하는 방식(빌드 시점에 고정)
// 2) Vercel Blob 저장소 — 관리자 페이지에서 수동 발행하거나, 매일 자동 생성된 초안을
//    검토 후 발행하는 방식(재배포 없이 즉시 반영)
// 두 소스 모두 같은 Post 형태로 정규화해 목록/상세 페이지가 출처를 신경 쓰지 않게 한다.

const POSTS_DIR = path.join(process.cwd(), "content", "blog");
const DEFAULT_AUTHOR = "Tibedra";

export interface Post {
  slug: string;
  title: string;
  /** 작성일 (YYYY-MM-DD) */
  date: string;
  summary: string;
  author: string;
  /** 분야 라벨 (예: "AI", "투자", "여행") — 없을 수 있음 */
  category?: string;
  tags: string[];
  /** marked 로 렌더링한 본문 HTML */
  html: string;
  /** 대략적인 읽기 시간(분) */
  readingMinutes: number;
  /** 매일 자동 생성된 초안이 검토 후 발행된 글인지 여부 */
  aiGenerated?: boolean;
}

function readingMinutes(text: string): number {
  // 한국어는 대략 분당 500자 안팎으로 읽는다고 보고 반올림(최소 1분).
  const chars = text.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

/** 마크다운 원문을 렌더링해 HTML + 읽기시간을 함께 반환한다. */
export function renderMarkdown(markdown: string): { html: string; readingMinutes: number } {
  return {
    html: marked.parse(markdown, { async: false }) as string,
    readingMinutes: readingMinutes(markdown),
  };
}

function fileSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** 빌드 시점에 정적 생성할 파일 기반 slug 목록 (generateStaticParams 용). */
export function getFileSlugs(): string[] {
  return fileSlugs();
}

function readFilePost(slug: string): Post | null {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);

  const date =
    data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date ?? "").slice(0, 10);

  const { html, readingMinutes: minutes } = renderMarkdown(content);

  return {
    slug,
    title: String(data.title ?? slug),
    date,
    summary: String(data.summary ?? ""),
    author: String(data.author ?? DEFAULT_AUTHOR),
    category: data.category ? String(data.category) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    html,
    readingMinutes: minutes,
  };
}

function storedToPost(stored: StoredPost): Post {
  const { html, readingMinutes: minutes } = renderMarkdown(stored.markdown);
  return {
    slug: stored.slug,
    title: stored.title,
    date: stored.date,
    summary: stored.summary,
    author: stored.author,
    category: stored.category,
    tags: stored.tags,
    html,
    readingMinutes: minutes,
    aiGenerated: stored.aiGenerated,
  };
}

function sortByDateDesc(posts: Post[]): Post[] {
  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** 파일 기반 글만 동기로 읽는다 (generateStaticParams 등 build-time 용도). */
export function getFilePosts(): Post[] {
  return sortByDateDesc(fileSlugs().map(readFilePost).filter((p): p is Post => p !== null));
}

/** 공개된 모든 글(파일 + Blob 발행분)을 최신순으로 반환한다. */
export async function getAllPosts(): Promise<Post[]> {
  const files = getFilePosts();
  const stored = await readStore();
  const published = stored.filter((p) => p.status === "published").map(storedToPost);
  return sortByDateDesc([...files, ...published]);
}

/** slug 에 해당하는 공개된 글을 반환한다. 없거나 미발행이면 null. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const file = readFilePost(slug);
  if (file) return file;
  const stored = await readStore();
  const match = stored.find((p) => p.slug === slug && p.status === "published");
  return match ? storedToPost(match) : null;
}

/** YYYY-MM-DD 를 "2026년 7월 14일" 형태의 한국어 라벨로 변환한다. */
export function postDateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00+09:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
