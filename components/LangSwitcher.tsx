"use client";

import { useCallback, useEffect, useState } from "react";

// 사이트 전체를 Google 번역 위젯으로 다국어 표시한다.
// - 원문은 한국어. 사용자가 EN/中/日 을 고르면 googtrans 쿠키를 심고 새로고침한다.
// - 한국어(원문)일 때는 Google 스크립트를 아예 로드하지 않아 기본 성능/광고에 영향이 없다.
// - 다른 언어가 선택된 경우에만 마운트 후 위젯을 주입해 쿠키 기준으로 번역을 적용한다.

const LANGS = [
  { code: "ko", label: "KO", full: "한국어" },
  { code: "en", label: "EN", full: "English" },
  { code: "zh-CN", label: "中", full: "中文" },
  { code: "ja", label: "日", full: "日本語" },
] as const;

function currentLang(): string {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!m) return "ko";
  const parts = decodeURIComponent(m[1]).split("/");
  return parts[2] || "ko";
}

function applyCookie(target: string) {
  const host = location.hostname;
  const root = host.replace(/^www\./, "");
  const scopes = ["", `; domain=${host}`, `; domain=.${root}`];
  if (target === "ko") {
    // 쿠키 제거 → 원문(한국어)로 복귀
    for (const s of scopes) {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${s}`;
    }
  } else {
    const val = `/ko/${target}`;
    for (const s of scopes) {
      document.cookie = `googtrans=${val}; path=/${s}`;
    }
  }
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement: new (opts: unknown, el: string) => void } };
  }
}

function injectWidget() {
  if (document.getElementById("google-translate-script")) return;
  window.googleTranslateElementInit = () => {
    if (!window.google?.translate) return;
    new window.google.translate.TranslateElement(
      { pageLanguage: "ko", includedLanguages: "en,zh-CN,ja", autoDisplay: false },
      "google_translate_element"
    );
  };
  const s = document.createElement("script");
  s.id = "google-translate-script";
  s.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.body.appendChild(s);
}

export default function LangSwitcher() {
  const [current, setCurrent] = useState("ko");

  useEffect(() => {
    const cur = currentLang();
    setCurrent(cur);
    if (cur !== "ko") injectWidget();
  }, []);

  const choose = useCallback(
    (code: string) => {
      if (code === current) return;
      applyCookie(code);
      location.reload();
    },
    [current]
  );

  return (
    <>
      {/* Google 번역 위젯이 붙는 컨테이너 (globals.css 에서 화면 밖으로 숨김) */}
      <div id="google_translate_element" aria-hidden="true" />

      <div
        className="notranslate flex items-center gap-px"
        translate="no"
        aria-label="언어 선택"
      >
        {LANGS.map((l) => {
          const active = current === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => choose(l.code)}
              aria-pressed={active}
              title={l.full}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "text-muted hover:text-accent hover:bg-accent-soft"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
