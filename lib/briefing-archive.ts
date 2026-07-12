import { put, list } from "@vercel/blob";
import type { DailyBriefing } from "./briefing";

// 데일리 브리핑 영구 아카이브 (Vercel Blob).
// - unstable_cache 는 TTL/태그로 무효화될 수 있어 "진짜 과거 기록"을 보장하지 못한다.
//   (원본 RSS 기사가 피드에서 빠지면 같은 날짜를 재생성해도 다른 내용이 나옴)
// - 생성된 브리핑을 이곳에 한 번 더 저장해, 몇 달 뒤에도 그날 그 글이 그대로 남도록 한다.
// - BLOB_READ_WRITE_TOKEN 이 없으면(스토리지 미연결) 조용히 비활성화된다.

const PREFIX = "briefings/";

function blobPath(dateKey: string): string {
  return `${PREFIX}${dateKey}.json`;
}

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** 생성된 브리핑을 아카이브에 저장한다. 실패해도 무시(아카이브는 부가 기능). */
export async function archiveBriefing(briefing: DailyBriefing): Promise<void> {
  if (!hasBlobToken()) return;
  try {
    await put(blobPath(briefing.date), JSON.stringify(briefing), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
  } catch {
    // 아카이브 실패는 당일 브리핑 노출에 영향을 주지 않는다.
  }
}

/** 아카이브에서 특정 날짜(YYYY-MM-DD)의 브리핑을 읽어온다. 없으면 null. */
export async function getArchivedBriefing(dateKey: string): Promise<DailyBriefing | null> {
  if (!hasBlobToken()) return null;
  try {
    const { blobs } = await list({ prefix: blobPath(dateKey), limit: 1 });
    const blob = blobs[0];
    if (!blob) return null;
    const res = await fetch(blob.url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) return null;
    return (await res.json()) as DailyBriefing;
  } catch {
    return null;
  }
}

/** 아카이브에 저장된 날짜 목록을 최신순으로 반환한다(최대 limit개). */
export async function listArchivedDates(limit = 60): Promise<string[]> {
  if (!hasBlobToken()) return [];
  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
    return blobs
      .map((b) => b.pathname.slice(PREFIX.length).replace(/\.json$/, ""))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, limit);
  } catch {
    return [];
  }
}
