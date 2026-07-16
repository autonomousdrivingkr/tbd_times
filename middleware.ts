import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const LOCALE_COOKIE = "NEXT_LOCALE";

// /portfolio 서브트리 전용 로케일 라우팅. next-intl의 createMiddleware는 로케일이
// 경로 첫 세그먼트라고 가정해 /portfolio 하위 경로와 바로 맞지 않으므로, 여기서는
// 실제로 필요한 두 가지만 직접 처리한다: (1) 로케일 없는 /portfolio 진입 시
// 기본/저장된 로케일로 리다이렉트, (2) 방문한 로케일을 쿠키에 기억.
// 나머지 사이트와 /api/* 는 matcher 밖이라 이 미들웨어를 아예 거치지 않는다.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/portfolio", "/portfolio/:path*"],
};
