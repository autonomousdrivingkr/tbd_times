import { put } from "@vercel/blob";

// 블로그 글의 대표 이미지 업로드 전용 모듈.
// - 글 데이터(blog/posts.json)를 담는 스토어는 private 전용이라 공개 페이지에서
//   바로 <img src> 로 보여줄 수 없다(인증 필요). 그래서 이미지 전용의 별도
//   public 스토어(BLOG_IMAGES_STORE_ID)를 두고 여기에만 업로드한다.
// - 프로젝트에는 스토어가 두 개 연결돼 있어(글 데이터용 private + 이미지용 public),
//   OIDC 인증이 기본으로 잡는 process.env.BLOB_STORE_ID(글 데이터 스토어)가 아닌
//   이미지 스토어를 명시적으로 쓰도록 매 호출마다 storeId 를 지정한다.

const PREFIX = "blog/images/";
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function hasImageStore(): boolean {
  return Boolean(process.env.BLOG_IMAGES_STORE_ID);
}

export function isAllowedImageType(contentType: string): boolean {
  return ALLOWED_TYPES.has(contentType);
}

export function isWithinSizeLimit(size: number): boolean {
  return size > 0 && size <= MAX_SIZE_BYTES;
}

function extFromContentType(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/** 업로드된 이미지를 public 스토어에 저장하고 접근 가능한 URL을 반환한다. */
export async function uploadBlogImage(
  body: ArrayBuffer,
  contentType: string
): Promise<string> {
  const storeId = process.env.BLOG_IMAGES_STORE_ID;
  const key = `${PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFromContentType(contentType)}`;
  const blob = await put(key, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    storeId,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return blob.url;
}
