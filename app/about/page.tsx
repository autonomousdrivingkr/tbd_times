import type { Metadata } from "next";
import { SOURCES } from "@/lib/sources";

export const metadata: Metadata = {
  title: "소개",
  description:
    "Tibedra는 전세계 AI·반도체·빅테크와 투자·금융(코인 포함), 여행 뉴스를 매일 아침 자동으로 모아 정리하는 데일리 브리핑입니다.",
};

export default function AboutPage() {
  const ai = SOURCES.filter((s) => s.category === "ai");
  const invest = SOURCES.filter((s) => s.category === "investment");
  const travel = SOURCES.filter((s) => s.category === "travel");

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">Tibedra 소개</h1>
      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink-soft">
        <p>
          <strong className="text-ink">Tibedra</strong>는 전세계의 AI·반도체·빅테크 소식과 투자·금융
          (코인 포함), 그리고 여행 뉴스를 매일 아침 자동으로 모아 한 페이지에서 빠르게 훑어볼 수
          있도록 정리하는 데일리 브리핑 서비스입니다.
        </p>
        <p>
          각 기사는 신뢰할 수 있는 매체의 공개 RSS 피드에서 <strong className="text-ink">헤드라인과
          짧은 요약</strong>만 가져오며, 본문 전체는 복제하지 않습니다. 여기에 Tibedra 편집팀이 AI
          도구의 도움을 받아 <strong className="text-ink">배경·맥락·시사점을 덧붙인 해설 브리핑</strong>을
          함께 제공하며, 모든 브리핑에는 원문 매체로 가는 출처 링크가 명시됩니다. 기사 저작권은 각
          매체에 있습니다.
        </p>
        <p>
          뉴스는 매일 아침 <strong className="text-ink">06:00(KST)</strong>에 자동 갱신되며, 그 사이에도
          30분 단위로 최신 소식이 반영됩니다. 해외 매체의 영어 기사는{" "}
          <strong className="text-ink">AI(Google Gemini)로 한국어 제목·요약을 자동 번역</strong>해
          제공합니다.
        </p>
      </div>

      <h2 className="mt-10 font-serif text-2xl font-bold">자체 콘텐츠</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        Tibedra는 단순 수집을 넘어 다음 콘텐츠를 직접 만듭니다. 자체 콘텐츠는 Tibedra 편집팀
        명의로 발행되며, AI 도구를 활용해 작성된 경우 해당 페이지에 이를 표기합니다.
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-soft">
        <li>
          <a className="text-accent underline" href="/briefing">
            오늘의 브리핑
          </a>{" "}
          — 매일 아침 주요 뉴스를 3가지 테마로 묶어 해설하는 데일리 칼럼
        </li>
        <li>
          <strong className="text-ink">기사별 해설 브리핑</strong> — 개별 기사에 배경과 맥락,
          핵심 포인트를 덧붙인 해설 페이지
        </li>
        <li>
          <a className="text-accent underline" href="/glossary">
            용어사전
          </a>{" "}
          — AI·투자·코인 핵심 용어를 직접 풀이한 해설 모음
        </li>
        <li>
          <a className="text-accent underline" href="/faq">
            자주 묻는 질문
          </a>{" "}
          — 서비스와 뉴스 읽기에 대한 안내
        </li>
      </ul>

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
          <h3 className="mb-2 text-sm font-bold text-invest">투자 · 금융 · 코인</h3>
          <ul className="space-y-1 text-sm text-ink-soft">
            {invest.map((s) => (
              <li key={s.name}>· {s.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-travel">여행 · 레저</h3>
          <ul className="space-y-1 text-sm text-ink-soft">
            {travel.map((s) => (
              <li key={s.name}>· {s.name}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className="mt-10 font-serif text-2xl font-bold">편집 원칙</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        Tibedra는 독자가 매일 아침 가장 적은 시간으로 가장 중요한 흐름을 파악하도록 돕는 것을
        목표로 합니다. 이를 위해 다음 원칙을 지킵니다.
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-soft">
        <li>
          <strong className="text-ink">출처 우선</strong> — 모든 항목은 원문 매체로 연결되며,
          저작권은 원 매체에 있습니다.
        </li>
        <li>
          <strong className="text-ink">요약과 링크</strong> — 기사 전문을 복제하지 않고 제목·요약·
          링크만 제공합니다.
        </li>
        <li>
          <strong className="text-ink">투명한 자동화</strong> — 수집과 번역은 자동화되어 있으며,
          자동 번역의 한계를 분명히 밝힙니다.
        </li>
        <li>
          <strong className="text-ink">중립성</strong> — 특정 종목·자산에 대한 투자 권유를 하지
          않습니다.
        </li>
      </ul>

      <h2 className="mt-10 font-serif text-2xl font-bold">콘텐츠 수집·선별 방법</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        뉴스는 각 매체가 공개한 RSS/Atom 피드를 통해 수집합니다. 수집된 항목은 중복 제거와 시간순
        정렬을 거쳐 분야(AI·투자·여행)와 키워드 섹션(반도체·빅테크 등)으로 분류됩니다. 안정적으로
        피드를 제공하고 분야 적합성이 높은 매체를 우선 큐레이션하며, 피드 품질에 따라 매체 목록은
        주기적으로 조정됩니다. 해외 영어 기사의 제목·요약은 생성형 AI로 한국어 번역하며, 자동 번역의
        특성상 정확한 내용은 원문 확인을 권장합니다.
      </p>

      <h2 className="mt-10 font-serif text-2xl font-bold">정정·삭제 요청</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        표시된 제목이나 요약에 오류가 있거나 저작권자께서 게시 중단을 원하시는 경우,{" "}
        <a className="text-accent underline" href="/contact">
          문의 페이지
        </a>
        를 통해 알려 주시면 신속히 확인하여 정정 또는 삭제하겠습니다.
      </p>

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
