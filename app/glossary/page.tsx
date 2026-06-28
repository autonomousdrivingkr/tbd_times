import type { Metadata } from "next";
import { GLOSSARY } from "@/lib/glossary";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_ACCENT } from "@/lib/sources";

export const metadata: Metadata = {
  title: "용어사전",
  description:
    "AI·투자·코인 뉴스를 읽을 때 자주 등장하는 핵심 용어를 쉽고 정확하게 풀이한 용어사전. 거대언어모델, 기준금리, 블록체인 등 36개 용어 정리.",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const glossaryJsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "TBD Times 용어사전",
  description: "AI·투자·코인 뉴스 이해에 필요한 핵심 용어 해설",
  url: `${siteUrl}/glossary`,
  inLanguage: "ko-KR",
  hasDefinedTerm: CATEGORIES.flatMap((cat) =>
    GLOSSARY[cat].map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.def,
    }))
  ),
};

export default function GlossaryPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(glossaryJsonLd) }}
      />
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">용어사전</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
        AI·투자·코인 뉴스를 읽다 보면 낯선 용어가 자주 등장합니다. TBD Times 용어사전은 뉴스를
        이해하는 데 꼭 필요한 핵심 개념을 분야별로 쉽고 간결하게 정리했습니다. 정보 제공을 목적으로
        하며, 투자 판단의 근거로 삼기 전에는 반드시 원문과 공식 자료를 확인하세요.
      </p>

      {/* 분야 바로가기 */}
      <nav className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={`#${cat}`}
            className="rounded-full border border-line bg-paper-2 px-4 py-1.5 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent"
          >
            {CATEGORY_LABELS[cat]} 용어
          </a>
        ))}
      </nav>

      {CATEGORIES.map((cat) => (
        <section key={cat} id={cat} className="mt-12 scroll-mt-24">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
            <span
              className="h-6 w-1.5 rounded-full"
              style={{ background: CATEGORY_ACCENT[cat] }}
            />
            {CATEGORY_LABELS[cat]} 용어
          </h2>
          <dl className="mt-5 divide-y divide-line">
            {GLOSSARY[cat].map((t) => (
              <div key={t.term} className="py-4">
                <dt className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-bold text-ink">{t.term}</span>
                  {t.en && <span className="text-xs text-muted">{t.en}</span>}
                </dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{t.def}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
