import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const LOCALE_COOKIE = "NEXT_LOCALE";
const CANONICAL_HOST = "tibedra.com";

// www→apex 정규화. 세션 쿠키(next-auth)가 Domain 속성 없이(host-only) 발급되므로
// tibedra.com에서 로그인한 뒤 www.tibedra.com으로 넘어가면(북마크·검색결과·공유링크 등)
// 브라우저가 그 쿠키를 안 보내 로그인이 풀린 것처럼 보인다 — 두 호스트가 리다이렉트
// 없이 각각 200을 응답하던 게 원인. 항상 apex 하나로만 접속하도록 강제해 이 불일치를
// 원천 차단한다("사이트 다른 섹션 갔다 오면 로그인이 풀린다" 리포트의 실제 원인).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  if (host === `www.${CANONICAL_HOST}`) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/portfolio") {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = routing.locales.includes(cookieLocale as "ko" | "en")
      ? (cookieLocale as string)
      : routing.defaultLocale;
    return NextResponse.redirect(new URL(`/portfolio/${locale}`, request.url));
  }

  const match = pathname.match(/^\/portfolio\/(ko|en)(?:\/|$)/);
  if (match) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, match[1], { path: "/portfolio" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // www 리다이렉트는 사이트 전체에 적용돼야 하므로 정적 자산만 제외하고 전 경로를 매칭한다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
