import type { Metadata } from "next";
import { SOURCES } from "@/lib/sources";

export const metadata: Metadata = {
  title: "소개",
  description: "TBD Times 는 전세계 AI·투자 뉴스를 매일 아침 자동으로 모아 정리하는 데일리 브리핑입니다.",
};

export default function AboutPage() {
  const ai = SOURCES.filter((s) => s.category === "ai");
  const invest = SOURCES.filter((s) => s.category === "investment");
  const crypto = SOURCES.filter((s) => s.category === "crypto");

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">TBD Times 소개</h1>
      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink-soft">
        <p>
          <strong className="text-ink">TBD Times</strong>는 전세계의 AI·인공지능 소식과 투자·금융
          뉴스를 매일 아침 자동으로 모아 한 페이지에서 빠르게 훑어볼 수 있도록 정리하는 데일리
          브리핑 서비스입니다.
        </p>
        <p>
          각 기사는 신뢰할 수 있는 매체의 공개 RSS 피드에서 <strong className="text-ink">헤드라인과
          짧은 요약</strong>만 가져오며, 본문 전체는 제공하지 않습니다. 더 읽고 싶은 기사는 클릭하면
          원문 매체로 이동합니다. 저작권은 각 매체에 있습니다.
        </p>
        <p>
          뉴스는 매일 아침 <strong className="text-ink">06:00(KST)</strong>에 자동 갱신되며, 그 사이에도
          30분 단위로 최신 소식이 반영됩니다. 해외 매체의 영어 기사는{" "}
          <strong className="text-ink">AI(Google Gemini)로 한국어 제목·요약을 자동 번역</strong>해
          제공합니다.
        </p>
      </div>

      <h2 className="mt-10 font-serif text-2xl font-bold">수집 매체</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 text-sm font-bold text-ai">AI · 기술</h3>
          <ul className="space-y-1 text-sm text-ink-soft">
            {ai.map((s) => (
              <li key={s.name}>· {s.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-invest">투자 · 금융</h3>
          <ul className="space-y-1 text-sm text-ink-soft">
            {invest.map((s) => (
              <li key={s.name}>· {s.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-crypto">코인 · 가상자산</h3>
          <ul className="space-y-1 text-sm text-ink-soft">
            {crypto.map((s) => (
              <li key={s.name}>· {s.name}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className="mt-10 font-serif text-2xl font-bold">면책 조항</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        본 사이트의 모든 콘텐츠는 정보 제공을 목적으로 하며, 어떠한 투자 권유나 자문도 아닙니다.
        투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.
      </p>

      <h2 className="mt-10 font-serif text-2xl font-bold">문의</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        제휴·제보·콘텐츠 관련 문의는 이메일로 연락해 주세요.{" "}
        <a className="text-accent underline" href="mailto:dr.derek.ji@gmail.com">
          dr.derek.ji@gmail.com
        </a>
      </p>
    </div>
  );
}
