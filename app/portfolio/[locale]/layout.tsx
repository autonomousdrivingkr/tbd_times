import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { routing } from "@/i18n/routing";
import LocaleHtmlSync from "@/components/portfolio/LocaleHtmlSync";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PortfolioLocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ko" | "en")) {
    notFound();
  }

  // next-intl의 자동 로케일 감지는 보통 next-intl 자체 미들웨어가 심는 헤더에
  // 의존한다. 이 프로젝트는 /portfolio 서브트리 전용 커스텀 미들웨어를 쓰고
  // next-intl의 createMiddleware는 쓰지 않으므로, [locale] 세그먼트 값을
  // 요청 컨텍스트에 명시적으로 고정해야 getMessages()/useTranslations() 가
  // 항상 기본 로케일(ko)로 폴백하지 않는다.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* refetchOnWindowFocus 는 브라우저 탭이 포커스를 되찾을 때마다 세션을
          다시 확인한다 — 이 앱은 서버 컴포넌트(dashboard/layout.tsx의 auth()
          체크)로 이미 매 네비게이션마다 세션을 검증하고, useSession()도
          required 없이 딱 한 곳(게시글 상세의 삭제 버튼 노출용)에만 쓰여
          이 자동 재확인이 실질적인 이점이 없다. 반대로 이 재확인 요청이
          일시적으로 실패/지연되면 실제로는 로그인 상태인데도 화면이
          로그아웃된 것처럼 보이는 문제로 이어질 수 있어(다른 탭 갔다 오면
          로그인 화면이 다시 뜨는 리포트) 꺼둔다. */}
      <SessionProvider basePath="/api/portfolio/auth" refetchOnWindowFocus={false}>
        <LocaleHtmlSync locale={locale} />
        {/* 사이트 전역 Google 번역 위젯(LangSwitcher)이 이미 번역된 이 서브트리를
            다시 건드리지 않도록 제외한다. portfolio-theme는 OS 라이트/다크
            설정과 무관하게 이 서브트리에서만 고정 블랙 톤을 적용한다. */}
        <div className="notranslate portfolio-theme min-h-screen bg-paper" translate="no">
          {children}
        </div>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
