import Link from "next/link";
import { useTranslations } from "next-intl";

export default async function PortfolioLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <Landing locale={locale} />;
}

function Landing({ locale }: { locale: string }) {
  const t = useTranslations();
  const p = (path: string) => `/portfolio/${locale}${path}`;

  return (
    <div className="bg-paper">
      {/* Hero */}
      <main className="container-page pt-16 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent-soft border border-accent/20 rounded-full px-4 py-1.5 text-sm text-accent font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
            전 세계 70,000+ 종목 지원
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold leading-[1.15] tracking-tight text-ink">
            {t("home.hero")}
            <br />
            <span className="text-accent">{t("home.hero2")}</span>
          </h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            {t("home.subtitle")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href={p("/signup")}
              className="bg-accent hover:opacity-90 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-opacity"
            >
              {t("home.cta")} →
            </Link>
            <Link
              href={p("/login")}
              className="text-ink-soft hover:text-accent px-8 py-3.5 rounded-xl text-base font-medium border border-line hover:border-accent transition-colors"
            >
              {t("nav.login")}
            </Link>
          </div>
        </div>

        {/* Preview Card */}
        <div className="mt-16 max-w-3xl mx-auto rounded-2xl border border-line bg-paper-2 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-3 h-3 rounded-full bg-red-400/70"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400/70"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400/70"></div>
            <span className="ml-3 text-xs text-muted">대시보드 미리보기</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "총 자산", value: "$248,320", change: "+12.4%" },
              { label: "총 수익률", value: "+24.8%", change: "이번 달" },
              { label: "배당 수익", value: "$1,840", change: "연간" },
            ].map((card) => (
              <div key={card.label} className="bg-paper rounded-xl p-4 border border-line">
                <p className="text-xs text-muted mb-1">{card.label}</p>
                <p className="text-lg font-bold text-ink">{card.value}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{card.change}</p>
              </div>
            ))}
          </div>
          <div className="bg-paper rounded-xl p-4 border border-line">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-ink-soft">보유 자산</span>
              <span className="text-xs text-muted">수익률</span>
            </div>
            {[
              { symbol: "AAPL", name: "Apple Inc.", value: "$54,200", ret: "+18.2%" },
              { symbol: "QQQ", name: "Invesco QQQ ETF", value: "$38,900", ret: "+31.5%" },
              { symbol: "005930", name: "삼성전자", value: "$22,100", ret: "-4.1%" },
            ].map((row) => (
              <div key={row.symbol} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-paper-2 border border-line flex items-center justify-center text-xs font-bold text-ink-soft">
                    {row.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink">{row.symbol}</p>
                    <p className="text-xs text-muted">{row.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-ink">{row.value}</p>
                  <p className={`text-xs ${row.ret.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>{row.ret}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="container-page py-16 border-t border-line">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl font-bold text-ink">필요한 모든 것이 한 곳에</h2>
          <p className="mt-3 text-muted">복잡한 자산 관리를 단순하게</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: t("home.feature1Title"),
              desc: t("home.feature1Desc"),
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              ),
            },
            {
              title: t("home.feature2Title"),
              desc: t("home.feature2Desc"),
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
            },
            {
              title: t("home.feature3Title"),
              desc: t("home.feature3Desc"),
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((f) => (
            <div key={f.title} className="bg-paper-2 border border-line rounded-2xl p-7">
              <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-5">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-ink mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
