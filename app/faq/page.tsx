import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description:
    "TBD Times 서비스 이용, 뉴스 수집·번역 방식, 저작권, 광고 등 자주 묻는 질문을 정리했습니다.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "TBD Times는 어떤 서비스인가요?",
    a: (
      <>
        TBD Times는 전 세계의 인공지능(AI), 투자·금융, 가상자산(코인) 분야 뉴스를 매일 아침
        자동으로 모아 한 페이지에서 빠르게 훑어볼 수 있도록 정리하는 한국어 데일리 뉴스
        브리핑입니다. 신뢰할 수 있는 국내외 수십 개 매체가 공개한 RSS 피드에서 헤드라인과 짧은
        요약을 수집해 분야별·키워드별로 분류해 보여줍니다.
      </>
    ),
  },
  {
    q: "기사 전문을 여기서 읽을 수 있나요?",
    a: (
      <>
        아니요. TBD Times는 각 기사의 <strong>제목과 짧은 요약, 그리고 원문 링크</strong>만
        제공합니다. 전체 본문을 읽으려면 기사 카드를 클릭해 해당 매체의 원문 페이지로 이동하시면
        됩니다. 저작권은 모두 원 매체에 있으며, 본 서비스는 독자가 읽을 만한 원문을 더 쉽게 찾도록
        돕는 길잡이 역할을 합니다.
      </>
    ),
  },
  {
    q: "뉴스는 얼마나 자주 갱신되나요?",
    a: (
      <>
        매일 아침 <strong>6시(KST)</strong>에 전체 피드를 다시 수집해 그날의 브리핑을 새로
        구성합니다. 그 사이에도 약 30분 간격으로 최신 기사가 반영됩니다.
      </>
    ),
  },
  {
    q: "해외 기사의 한국어 번역은 어떻게 이뤄지나요?",
    a: (
      <>
        해외 영어 매체의 제목과 요약은 구글의 생성형 AI(Gemini)를 이용해 한국어로 자동 번역합니다.
        자동 번역 특성상 고유명사나 전문 용어에서 어색하거나 부정확한 표현이 있을 수 있으므로, 정확한
        내용은 반드시 원문을 확인해 주세요. 국내 매체 기사는 번역 없이 원문 그대로 제공합니다.
      </>
    ),
  },
  {
    q: "어떤 매체의 뉴스를 모으나요?",
    a: (
      <>
        해외의 주요 기술·경제·가상자산 매체와 국내 매체를 함께 큐레이션합니다. 수집 매체 전체 목록은{" "}
        <Link className="text-accent underline" href="/about">
          소개 페이지
        </Link>
        에서 확인할 수 있습니다. 안정적으로 피드를 제공하는 매체 위주로 선별하며, 품질을 위해 목록은
        주기적으로 조정됩니다.
      </>
    ),
  },
  {
    q: "이 사이트의 정보는 투자 조언인가요?",
    a: (
      <>
        아니요. TBD Times의 모든 콘텐츠는 <strong>정보 제공만을 목적</strong>으로 하며, 어떠한 투자
        권유나 자문도 아닙니다. 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.
      </>
    ),
  },
  {
    q: "광고는 왜 표시되나요?",
    a: (
      <>
        서비스의 운영·유지 비용을 충당하기 위해 구글 애드센스(Google AdSense) 광고를 게재합니다.
        광고 쿠키 사용 등 자세한 내용은{" "}
        <Link className="text-accent underline" href="/privacy">
          개인정보 처리방침
        </Link>
        을 참고하세요.
      </>
    ),
  },
  {
    q: "기사 정정·삭제나 제휴 문의는 어떻게 하나요?",
    a: (
      <>
        저작권 관련 요청, 기사 정정·삭제, 제휴·제보 등은{" "}
        <Link className="text-accent underline" href="/contact">
          문의 페이지
        </Link>
        의 이메일로 연락 주시면 신속히 확인하겠습니다.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">자주 묻는 질문</h1>
      <p className="mt-3 text-sm text-muted">
        TBD Times 이용에 대해 자주 묻는 질문을 모았습니다. 더 궁금한 점은 문의 페이지로 연락 주세요.
      </p>

      <div className="mt-8 divide-y divide-line">
        {FAQS.map((item) => (
          <section key={item.q} className="py-6">
            <h2 className="font-serif text-lg font-bold text-ink">Q. {item.q}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{item.a}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
