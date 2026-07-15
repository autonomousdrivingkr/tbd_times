import { put, get } from "@vercel/blob";
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
  /** 대표 이미지 URL (목록 카드·상세 히어로에 사용) */
  image?: string;
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
 * 스토어는 private 접근이라 get() 이 자체적으로 인증(고정 토큰 또는 OIDC)을 처리한다.
 * 파일 크기가 작고 요청량도 적은 개인 블로그 규모라, 발행 직후 CDN 캐시로 인한
 * 불일치를 피하기 위해 항상 origin 에서 최신 값을 읽는다(useCache: false).
 * @param fresh 과거 호출부와의 호환을 위해 남겨둔 파라미터(현재는 동작에 영향 없음).
 */
export async function readStore(fresh = false): Promise<StoredPost[]> {
  void fresh;
  if (!hasBlobStore()) return [];
  try {
    const result = await get(STORE_PATH, { access: "private", useCache: false });
    if (!result) {
      console.error("[blog-store] get() returned null for", STORE_PATH);
      return [];
    }
    if (result.statusCode !== 200) {
      console.error("[blog-store] unexpected statusCode", result.statusCode);
      return [];
    }
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text) as StoredPost[];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[blog-store] readStore failed", err);
    return [];
  }
}

async function writeStore(posts: StoredPost[]): Promise<void> {
  await put(STORE_PATH, JSON.stringify(posts), {
    access: "private",
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
