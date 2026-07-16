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
      <SessionProvider basePath="/api/portfolio/auth">
        <LocaleHtmlSync locale={locale} />
        {/* 사이트 전역 Google 번역 위젯(LangSwitcher)이 이미 번역된 이 서브트리를
            다시 건드리지 않도록 제외한다. */}
        <div className="notranslate" translate="no">
          {children}
        </div>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
