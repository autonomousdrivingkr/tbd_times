import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의",
  description:
    "TBD Times 제휴·광고, 제보, 기사 정정·삭제, 저작권 관련 문의 안내. 이메일로 연락 주세요.",
};

const EMAIL = "dr.derek.ji@gmail.com";

const TOPICS: { title: string; desc: string }[] = [
  { title: "제휴 · 광고", desc: "콘텐츠 제휴, 광고 게재, 협업 제안" },
  { title: "제보", desc: "다뤄지면 좋을 뉴스나 주제 추천" },
  { title: "정정 · 삭제 요청", desc: "표시된 제목·요약의 정정 또는 삭제 요청" },
  { title: "저작권", desc: "저작권자 권리 보호 및 게시 중단 요청" },
];

export default function ContactPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">문의</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
        TBD Times에 대한 의견, 제휴·광고 제안, 제보, 기사 정정·삭제 및 저작권 관련 요청은 아래
        이메일로 연락 주세요. 영업일 기준으로 확인 후 신속히 답변드리겠습니다.
      </p>

      <div className="mt-6 rounded-lg border border-line bg-paper-2 px-5 py-4">
        <p className="text-xs uppercase tracking-widest text-muted">이메일</p>
        <a
          className="mt-1 inline-block font-serif text-xl font-bold text-accent underline"
          href={`mailto:${EMAIL}`}
        >
          {EMAIL}
        </a>
      </div>

      <h2 className="mt-10 font-serif text-2xl font-bold">이런 문의를 도와드립니다</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {TOPICS.map((t) => (
          <div key={t.title} className="rounded-lg border border-line px-4 py-3">
            <p className="font-semibold text-ink">{t.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{t.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm leading-relaxed text-muted">
        TBD Times는 외부 매체의 공개 RSS 피드를 기반으로 헤드라인과 요약을 제공하며, 모든 기사의
        저작권은 각 매체에 있습니다. 권리자의 정당한 요청이 있을 경우 해당 항목을 신속히 조치합니다.
      </p>
    </div>
  );
}
