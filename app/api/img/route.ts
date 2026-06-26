import { NextRequest } from "next/server";

// 외부 이미지(주로 http:// 혼합콘텐츠)를 서버에서 받아 같은 https 출처로 재전송한다.
// - HTTPS 사이트에서 http 이미지가 차단되는 문제 해결
// - 일부 핫링크(referrer) 차단 우회
// 응답은 Cache-Control 로 Vercel CDN 에 캐시된다.

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB 상한 (악용 방지)
const UA =
  "Mozilla/5.0 (compatible; TBDTimesBot/1.0; +https://tbdtimes.vercel.app/about)";

// SSRF 방지: 내부/사설/링크로컬 대역 차단
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "::1") return true;
  if (h === "0.0.0.0") return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new Response("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("bad scheme", { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return new Response("blocked host", { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: target.origin + "/",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) return new Response("upstream error", { status: 502 });

    const ct = upstream.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) {
      return new Response("not an image", { status: 415 });
    }
    const declared = Number(upstream.headers.get("content-length") || 0);
    if (declared && declared > MAX_BYTES) {
      return new Response("too large", { status: 413 });
    }

    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return new Response("too large", { status: 413 });
    }

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("fetch failed", { status: 502 });
  }
}
