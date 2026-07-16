"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const p = (path: string) => `/portfolio/${locale}${path}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError(t("auth.loginError"));
    } else {
      router.push(p("/dashboard"));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-paper-2 border-r border-line flex-col justify-between p-12">
        <Link href={p("/")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-serif text-lg font-bold text-ink tracking-tight">{t("common.appName")}</span>
        </Link>

        <div>
          <blockquote className="font-serif text-2xl font-medium text-ink leading-snug mb-4">
            &ldquo;전 세계 자산을 한 눈에,<br />더 스마트한 투자 관리&rdquo;
          </blockquote>
          <p className="text-muted text-sm">주식 · ETF · 채권 · 실시간 수익률 · 배당 추적</p>
        </div>

        <div className="flex gap-4">
          {["AAPL +18.2%", "QQQ +31.5%", "삼성전자 -4.1%"].map((item) => (
            <div key={item} className="bg-paper border border-line rounded-lg px-3 py-2 text-xs text-muted">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-paper px-8">
        <div className="w-full max-w-sm">
          <Link href={p("/")} className="flex lg:hidden items-center gap-2 mb-10 justify-center">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-serif text-lg font-bold text-ink tracking-tight">{t("common.appName")}</span>
          </Link>

          <h1 className="font-serif text-2xl font-bold text-ink mb-1">{t("auth.loginTitle")}</h1>
          <p className="text-sm text-muted mb-8">계정에 로그인하세요</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
                className="w-full border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow bg-paper-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                required
                className="w-full border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow bg-paper-2"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:opacity-90 text-white py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t("common.loading")}
                </span>
              ) : t("auth.loginButton")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t("auth.noAccount")}{" "}
            <Link href={p("/signup")} className="text-accent font-semibold hover:opacity-80 transition-opacity">
              {t("nav.signup")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
