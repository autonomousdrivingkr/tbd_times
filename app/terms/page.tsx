import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관",
  description: "Tibedra 서비스 이용약관 — 서비스 내용, 저작권, 면책, 외부 링크에 대한 안내.",
};

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">이용약관</h1>
      <p className="mt-3 text-xs text-muted">최종 업데이트: 2026-06-27</p>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-serif text-xl font-bold text-ink">제1조 (목적)</h2>
          <p className="mt-2">
            본 약관은 Tibedra(이하 &ldquo;사이트&rdquo;)가 제공하는 뉴스 브리핑 서비스의 이용 조건과
            절차, 이용자와 사이트의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">제2조 (서비스의 내용)</h2>
          <p className="mt-2">
            사이트는 국내외 매체가 공개한 RSS 피드를 기반으로 뉴스의 제목과 짧은 요약, 원문 링크를
            수집·분류하여 제공합니다. 사이트는 기사 전문을 제공하지 않으며, 이용자는 원문 링크를 통해
            해당 매체에서 전체 내용을 확인할 수 있습니다. 해외 매체의 기사 제목·요약은 생성형 AI를
            이용해 한국어로 자동 번역될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">제3조 (저작권)</h2>
          <p className="mt-2">
            각 기사의 제목·요약·이미지 등 모든 저작물에 대한 권리는 원 저작권자(해당 매체)에게
            있습니다. 사이트는 공개된 피드의 범위에서 요약과 링크만을 표시하며, 원문 콘텐츠를 복제하여
            제공하지 않습니다. 저작권자의 정당한 요청이 있을 경우 해당 항목을 신속히 수정하거나
            삭제합니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">제4조 (면책)</h2>
          <p className="mt-2">
            사이트가 제공하는 모든 정보는 정보 제공만을 목적으로 하며, 투자 권유나 자문이 아닙니다.
            투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다. 또한 뉴스의 자동 수집·번역
            과정에서 발생할 수 있는 오류나 지연, 외부 매체 사정으로 인한 정보의 부정확성에 대해
            사이트는 법이 허용하는 범위에서 책임을 지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">제5조 (외부 링크)</h2>
          <p className="mt-2">
            사이트의 기사 링크는 외부 매체로 연결됩니다. 외부 사이트의 콘텐츠와 개인정보 처리에
            대해서는 해당 사이트의 정책이 적용되며, 사이트는 이에 대해 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">제6조 (약관의 변경)</h2>
          <p className="mt-2">
            사이트는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 본
            페이지를 통해 공지합니다. 변경된 약관은 게시 시점부터 효력이 발생합니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">문의</h2>
          <p className="mt-2">
            약관에 대한 문의는{" "}
            <Link className="text-accent underline" href="/contact">
              문의 페이지
            </Link>
            를 이용해 주세요.
          </p>
        </section>

        <p className="text-sm text-muted">부칙: 본 약관은 게시일(2026-06-27)부터 시행됩니다.</p>
      </div>
    </div>
  );
}
