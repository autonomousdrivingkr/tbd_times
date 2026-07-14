import { put, list } from "@vercel/blob";
import { hasBlobAccess } from "./blob-env";

// 런타임에 생성되는 블로그 글(수동 발행 · 매일 자동 초안)을 Vercel Blob 에 저장한다.
// - 저장소 글은 git 배포 없이 즉시 반영돼야 하므로 파일(content/blog)과 달리 Blob 을 쓴다.
// - 단순함을 위해 전체 글을 하나의 JSON 배열(blog/posts.json)로 관리한다
//   (개인 블로그 규모라 단일 파일로 충분하고, 목록 조회가 fetch 1회로 끝난다).
// - Blob 접근 수단(고정 토큰 또는 OIDC)이 전혀 없으면(스토리지 미연결) 조용히 비활성화된다.

const STORE_PATH = "blog/posts.json";

export type PostStatus = "draft" | "published";

export interface StoredPost {
  slug: string;
  title: string;
  /** 작성일 (YYYY-MM-DD) */
  date: string;
  summary: string;
  author: string;
  category?: string;
  tags: string[];
  /** 마크다운 원문 */
  markdown: string;
  status: PostStatus;
  /** 생성 시각 (ISO) */
  createdAt: string;
  /** 매일 자동 생성된 초안 여부 */
  aiGenerated?: boolean;
}

export function hasBlobStore(): boolean {
  return hasBlobAccess();
}

/**
 * 저장된 글 전체를 읽어온다.
 * @param fresh true 면 캐시를 우회(관리자·쓰기 직후 최신값 필요 시). false 면 태그 캐시 사용.
 */
export async function readStore(fresh = false): Promise<StoredPost[]> {
  if (!hasBlobStore()) return [];
  try {
    const { blobs } = await list({ prefix: STORE_PATH, limit: 1 });
    const blob = blobs[0];
    if (!blob) return [];
    const res = await fetch(blob.url, {
      cache: fresh ? "no-store" : undefined,
      next: fresh ? undefined : { tags: ["blog"], revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as StoredPost[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeStore(posts: StoredPost[]): Promise<void> {
  await put(STORE_PATH, JSON.stringify(posts), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

/** 글을 추가하거나(같은 slug 있으면) 교체한다. */
export async function upsertStoredPost(post: StoredPost): Promise<void> {
  const posts = await readStore(true);
  const idx = posts.findIndex((p) => p.slug === post.slug);
  if (idx >= 0) posts[idx] = post;
  else posts.push(post);
  await writeStore(posts);
}

/** 단일 글을 읽는다(상태 무관). 없으면 null. */
export async function getStoredPost(slug: string, fresh = false): Promise<StoredPost | null> {
  const posts = await readStore(fresh);
  return posts.find((p) => p.slug === slug) ?? null;
}

/** 글의 발행 상태를 변경한다. */
export async function setStoredPostStatus(slug: string, status: PostStatus): Promise<boolean> {
  const posts = await readStore(true);
  const post = posts.find((p) => p.slug === slug);
  if (!post) return false;
  post.status = status;
  await writeStore(posts);
  return true;
}

/** 글을 삭제한다. */
export async function deleteStoredPost(slug: string): Promise<boolean> {
  const posts = await readStore(true);
  const next = posts.filter((p) => p.slug !== slug);
  if (next.length === posts.length) return false;
  await writeStore(next);
  return true;
}

/** slug 중복을 피해 고유 slug 를 만든다. */
export async function ensureUniqueSlug(base: string): Promise<string> {
  const posts = await readStore(true);
  const used = new Set(posts.map((p) => p.slug));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * 제목에서 slug 초안을 만든다. 영문 위주 제목은 읽기 좋은 하이픈 slug 로,
 * 한글 등 ASCII 로 옮기기 어려운 제목은 날짜+짧은 해시로 대체한다
 * (한글을 로마자로 억지로 바꾸면 의미 없는 slug 가 되기 때문).
 */
export function makeSlug(title: string, date: string): string {
  const ascii = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (ascii.length >= 8) return ascii.slice(0, 60);

  // FNV-1a 32bit 해시 (lib/slug.ts 의 뉴스 slug 방식과 동일한 접근)
  let h = 0x811c9dc5;
  for (let i = 0; i < title.length; i++) {
    h ^= title.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${date}-${h.toString(36)}`;
}
