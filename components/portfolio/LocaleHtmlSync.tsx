"use client";

import { useEffect } from "react";

// 루트 레이아웃만 <html>을 렌더링할 수 있어(lang="ko" 고정) /portfolio/en 방문 시
// lang 속성을 여기서 동기화한다. 색인 대상이 아닌 앱 섹션이라 감수 가능한 절충.
export default function LocaleHtmlSync({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = "ko";
    };
  }, [locale]);

  return null;
}
