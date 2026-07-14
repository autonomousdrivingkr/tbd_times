import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

// 개인 블로그 글은 저장소 안 마크다운 파일로 관리한다 (content/blog/*.md).
// 각 파일은 프론트매터(제목·날짜·요약·저자 등) + 마크다운 본문으로 구성되며,
// 파일명(확장자 제외)이 곧 URL slug 가 된다 (예: ai-coding-agents.md → /blog/ai-coding-agents).
// RSS 뉴스와 달리 사람이 직접 쓴 자체 콘텐츠라 별도 파이프라인으로 다룬다.

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
}

/** 프론트매터만 담은 요약형(목록·사이트맵용). 본문 HTML 은 제외. */
export type PostMeta = Omit<Post, "html">;

function slugsFromDir(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getPostSlugs(): string[] {
  return slugsFromDir();
}

function readingMinutes(text: string): number {
  // 한국어는 대략 분당 500자 안팎으로 읽는다고 보고 반올림(최소 1분).
  const chars = text.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

/** slug 에 해당하는 글 하나를 읽어 렌더링해 반환한다. 없으면 null. */
export function getPostBySlug(slug: string): Post | null {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);

  // 날짜는 gray-matter 가 Date 로 파싱할 수 있으므로 YYYY-MM-DD 문자열로 정규화한다.
  const date =
    data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date ?? "").slice(0, 10);

  const html = marked.parse(content, { async: false }) as string;

  return {
    slug,
    title: String(data.title ?? slug),
    date,
    summary: String(data.summary ?? ""),
    author: String(data.author ?? DEFAULT_AUTHOR),
    category: data.category ? String(data.category) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    html,
    readingMinutes: readingMinutes(content),
  };
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

/** 모든 글을 최신순(날짜 내림차순)으로 반환한다. */
export function getAllPosts(): Post[] {
  return slugsFromDir()
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
