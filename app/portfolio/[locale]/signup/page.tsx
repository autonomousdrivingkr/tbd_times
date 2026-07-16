"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function SignupPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const p = (path: string) => `/portfolio/${locale}${path}`;
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/portfolio/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? t("auth.signupError"));
    } else {
      router.push(p("/login"));
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
          <h2 className="font-serif text-3xl font-bold text-ink leading-snug mb-4">
            지금 시작하고<br />
            <span className="text-accent">스마트한 투자</span>를 경험하세요
          </h2>
          <p className="text-muted text-sm">무료로 시작 · 신용카드 불필요</p>
        </div>

        <div className="space-y-3">
          {["전 세계 주식·ETF·채권 실시간 연동", "포트폴리오별 수익률 자동 계산", "배당 수령 현황 자동 추적"].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-ink-soft">
              <div className="w-5 h-5 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
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

          <h1 className="font-serif text-2xl font-bold text-ink mb-1">{t("auth.signupTitle")}</h1>
          <p className="text-sm text-muted mb-8">무료 계정을 만들어 시작하세요</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("auth.name")}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("auth.namePlaceholder")}
                required
                className="w-full border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow bg-paper-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("auth.email")}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("auth.emailPlaceholder")}
                required
                className="w-full border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow bg-paper-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("auth.password")}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t("auth.passwordPlaceholder")}
                required
                minLength={6}
                className="w-full border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow bg-paper-2"
              />
              <p className="mt-1.5 text-xs text-muted">최소 6자 이상</p>
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
              ) : t("auth.signupButton")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t("auth.hasAccount")}{" "}
            <Link href={p("/login")} className="text-accent font-semibold hover:opacity-80 transition-opacity">
              {t("nav.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
