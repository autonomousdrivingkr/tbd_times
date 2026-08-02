import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import TokenCalculator from "@/components/TokenCalculator";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "AI 토큰 계산기 & LLM API 비용 계산기",
  description:
    "GPT-4o·Claude·Gemini·DeepSeek 등 주요 AI 모델의 토큰 수와 API 비용을 무료로 계산하세요. 한국어·영어 텍스트의 실시간 토큰 수 확인, 일일 요청량 기준 모델별 월간 비용 비교, 프롬프트 캐싱 절감 효과까지 한 번에 확인할 수 있습니다.",
  alternates: { canonical: `${siteUrl}/token-calculator` },
};

const FAQS: { q: string; a: React.ReactNode; text: string }[] = [
  {
    q: "토큰(token)이란 정확히 무엇인가요?",
    a: (
      <>
        토큰은 LLM이 텍스트를 처리하는 최소 단위로, 단어 전체가 아니라 단어의 일부(서브워드)나 문자
        조합인 경우가 많습니다. 예를 들어 영어 단어 &quot;tokenization&quot;은 하나의 토큰이 아니라
        &quot;token&quot;과 &quot;ization&quot; 같은 여러 조각으로 나뉠 수 있습니다. API 요금은 보통 이
        토큰 수를 기준으로 1M(100만) 토큰당 가격으로 청구됩니다.
      </>
    ),
    text: "토큰은 LLM이 텍스트를 처리하는 최소 단위로, 단어 전체가 아니라 단어의 일부(서브워드)나 문자 조합인 경우가 많습니다. API 요금은 보통 이 토큰 수를 기준으로 1M(100만) 토큰당 가격으로 청구됩니다.",
  },
  {
    q: "한국어와 영어의 토큰 수 계산 방식이 다른가요?",
    a: (
      <>
        네, 대부분의 LLM 토크나이저는 영어 등 라틴 문자 기준으로 어휘 사전이 최적화돼 있어 영어 텍스트는
        평균 약 4글자당 1토큰으로 처리됩니다. 반면 한글 음절은 서브워드 단위로 더 잘게 쪼개지는 경향이
        있어 평균 1.5~2글자당 1토큰에 가깝습니다 — 같은 글자 수라도 한국어 텍스트가 더 많은 토큰을
        소비하는 이유입니다. 이 계산기도 이 비율을 반영해 추정합니다.
      </>
    ),
    text: "대부분의 LLM 토크나이저는 영어 등 라틴 문자 기준으로 최적화돼 있어 영어 텍스트는 평균 약 4글자당 1토큰으로 처리됩니다. 반면 한글 음절은 서브워드 단위로 더 잘게 쪼개지는 경향이 있어 평균 1.5~2글자당 1토큰에 가깝습니다.",
  },
  {
    q: "입력(input) 토큰과 출력(output) 토큰의 요금이 왜 다른가요?",
    a: (
      <>
        입력 토큰은 모델이 한 번에 읽어 들이는 프롬프트이고, 출력 토큰은 모델이 한 글자씩 순차적으로
        생성해야 하는 결과물입니다. 생성 과정의 연산 비용이 훨씬 크기 때문에 대부분의 모델에서 출력
        토큰 단가가 입력 토큰 단가의 2~4배 수준으로 책정됩니다.
      </>
    ),
    text: "입력 토큰은 모델이 한 번에 읽어 들이는 프롬프트이고, 출력 토큰은 모델이 한 글자씩 순차적으로 생성해야 하는 결과물입니다. 생성 과정의 연산 비용이 훨씬 크기 때문에 대부분의 모델에서 출력 토큰 단가가 입력 토큰 단가의 2~4배 수준으로 책정됩니다.",
  },
  {
    q: "프롬프트 캐싱은 비용을 어떻게 줄여주나요?",
    a: (
      <>
        같은 프롬프트 앞부분(예: 시스템 프롬프트, 긴 참고 문서)을 여러 요청에서 반복해서 보내는 경우,
        프롬프트 캐싱을 지원하는 모델은 이전에 처리한 구간을 다시 계산하지 않고 재사용해 훨씬 저렴한
        단가로 청구합니다. 캐시가 적중하는 구간은 정상 입력 단가의 약 10% 수준으로 청구되는 경우가
        많습니다. 절감 효과를 극대화하려면 매 요청마다 바뀌는 내용(사용자 질문 등)은 프롬프트 맨
        뒤쪽에, 반복되는 고정 내용은 앞쪽에 배치하는 것이 좋습니다.
      </>
    ),
    text: "같은 프롬프트 앞부분을 여러 요청에서 반복해서 보내는 경우, 프롬프트 캐싱을 지원하는 모델은 이전에 처리한 구간을 재사용해 훨씬 저렴한 단가로 청구합니다. 캐시가 적중하는 구간은 정상 입력 단가의 약 10% 수준으로 청구되는 경우가 많습니다. 절감 효과를 극대화하려면 매 요청마다 바뀌는 내용은 프롬프트 뒤쪽에, 반복되는 고정 내용은 앞쪽에 배치하는 것이 좋습니다.",
  },
  {
    q: "이 계산기의 토큰 수·비용 추정치는 얼마나 정확한가요?",
    a: (
      <>
        토큰 수는 모델마다 서로 다른 토크나이저를 쓰기 때문에 정확한 값은 각 프로바이더의 공식
        토크나이저로만 확인할 수 있습니다. 이 계산기는 한국어·영어 텍스트의 평균적인 글자당 토큰
        밀도를 근거로 한 근사치를 제공하며, 실제 요금 산정 전 대략적인 예산을 가늠하는 용도로
        참고하시길 권합니다.
      </>
    ),
    text: "토큰 수는 모델마다 서로 다른 토크나이저를 쓰기 때문에 정확한 값은 각 프로바이더의 공식 토크나이저로만 확인할 수 있습니다. 이 계산기는 한국어·영어 텍스트의 평균적인 글자당 토큰 밀도를 근거로 한 근사치를 제공합니다.",
  },
  {
    q: "달러-원화 환율은 왜 실시간이 아니라 고정값을 쓰나요?",
    a: (
      <>
        AI API 요금은 모두 USD로 청구되므로, 원화 표시는 예산 감을 잡기 위한 참고용 환산치입니다. 이
        계산기는 계산 편의를 위해 1달러 = 1,400원으로 고정해 사용하며, 실제 청구·결제 시점의 환율과는
        차이가 있을 수 있습니다.
      </>
    ),
    text: "AI API 요금은 모두 USD로 청구되므로, 원화 표시는 예산 감을 잡기 위한 참고용 환산치입니다. 이 계산기는 계산 편의를 위해 1달러 = 1,400원으로 고정해 사용하며, 실제 청구·결제 시점의 환율과는 차이가 있을 수 있습니다.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.text },
  })),
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tibedra AI 토큰 계산기 & LLM API 비용 계산기",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  url: `${siteUrl}/token-calculator`,
  description:
    "GPT-4o·Claude·Gemini·DeepSeek 등 주요 AI 모델의 토큰 수와 API 비용을 실시간으로 계산하는 무료 웹 도구.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function TokenCalculatorPage() {
  return (
    <div className="container-page max-w-4xl py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <header className="mb-6 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span className="h-7 w-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">AI 토큰 계산기 &amp; API 비용 계산기</h1>
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-soft">
          텍스트를 붙여넣으면 실시간으로 예상 토큰 수를 계산하고, GPT-4o·Claude·Gemini·DeepSeek 등 주요
          모델의 API 비용을 일일 요청량 기준으로 비교할 수 있습니다. 모든 계산은 브라우저에서 즉시
          처리되며 입력한 텍스트는 어디로도 전송되지 않습니다.
        </p>
      </header>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} className="mb-6" />

      <TokenCalculator />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} className="my-8" />

      {/* SEO 가이드 콘텐츠 */}
      <section className="mt-4 max-w-3xl">
        <h2 className="font-serif text-2xl font-bold text-ink mb-4">LLM API 요금은 어떻게 계산될까</h2>
        <div className="space-y-5 text-[15px] leading-relaxed text-ink-soft">
          <p>
            OpenAI·Anthropic·Google·DeepSeek 같은 AI 모델 제공사는 API 사용량을 <strong>토큰(token)</strong>{" "}
            단위로 과금합니다. 토큰은 단어보다 작은 단위로, 텍스트를 모델이 처리하기 좋은 조각으로 잘게
            나눈 것입니다. 영어는 평균적으로 4글자가 1토큰에 대응하지만, 한국어는 음절이 서브워드로 더
            잘게 쪼개져 1.5~2글자당 1토큰에 가깝습니다. 즉 같은 내용을 담더라도 한국어 프롬프트가 영어보다
            더 많은 토큰을, 따라서 더 많은 비용을 소비하는 경향이 있습니다.
          </p>
          <p>
            요청 하나의 비용은 <strong>입력 토큰 수 × 입력 단가</strong>와{" "}
            <strong>출력 토큰 수 × 출력 단가</strong>의 합으로 계산됩니다. 출력 토큰은 모델이 순차적으로
            생성해야 해서 연산 비용이 더 크기 때문에, 대부분의 모델에서 출력 단가가 입력 단가보다 2~4배
            높게 책정돼 있습니다. 답변 길이를 제한하는 것만으로도 비용을 크게 줄일 수 있는 이유입니다.
          </p>
          <p>
            <strong>프롬프트 캐싱(prompt caching)</strong>은 반복되는 프롬프트 구간(시스템 지침, 긴 참고
            문서 등)을 다시 계산하지 않고 재사용해 비용을 줄이는 기능입니다. 캐시가 적중하는 구간은
            정상 입력 단가의 약 10% 수준으로 청구되는 경우가 많아, 트래픽이 많은 서비스일수록 절감
            효과가 커집니다. 효과를 극대화하려면 매번 바뀌는 사용자 입력은 프롬프트 뒤쪽에, 반복되는
            고정 내용은 앞쪽에 배치하는 것이 좋습니다 — 대부분의 캐싱 구현이 프롬프트 앞부분부터
            일치하는 만큼만 캐시를 적용하기 때문입니다.
          </p>
          <p>
            위 계산기는 이 원리를 그대로 반영합니다: 텍스트 토큰 카운터는 한국어·영어 글자 비율을 구분해
            토큰 수를 추정하고, 비용 계산기는 일일 요청 수·평균 입력/출력 토큰·캐싱 비율을 입력받아 9개
            주요 모델의 월간 예상 비용을 한 번에 비교합니다.
          </p>
        </div>

        <h2 className="font-serif text-2xl font-bold text-ink mt-10 mb-4">자주 묻는 질문</h2>
        <div className="divide-y divide-line border-t border-line">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-serif text-base font-bold text-ink">
                {item.q}
                <span className="shrink-0 text-muted transition-transform group-open:rotate-45 text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE} className="mt-10" />

      <p className="mt-10 border-t border-line pt-4 text-xs text-muted">
        가격은 각 프로바이더가 공개한 2026년 기준 요금표를 참고했으며 실제 청구 금액과 다를 수 있습니다.
        정확한 최신 요금은 각 제공사의 공식 요금 페이지에서 확인하세요. 관련 문의는{" "}
        <Link href="/contact" className="text-accent underline">
          문의 페이지
        </Link>
        를 이용해 주세요.
      </p>
    </div>
  );
}
