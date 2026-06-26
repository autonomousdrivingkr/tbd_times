import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "TBD Times 개인정보 처리방침 및 광고(Google AdSense) 관련 안내.",
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">개인정보 처리방침</h1>
      <p className="mt-3 text-xs text-muted">최종 업데이트: 2026-06-21</p>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-serif text-xl font-bold text-ink">1. 수집하는 정보</h2>
          <p className="mt-2">
            TBD Times 는 회원가입을 요구하지 않으며, 이름·이메일 등 개인을 직접 식별하는 정보를
            수집하지 않습니다. 다만 서비스 운영과 광고 제공을 위해 쿠키 및 접속 로그(브라우저 종류,
            접속 시각 등)가 자동으로 수집될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">2. 광고 및 쿠키 (Google AdSense)</h2>
          <p className="mt-2">
            본 사이트는 제3자 광고 서비스인 <strong>Google AdSense</strong>를 사용합니다. Google을
            포함한 제3자 공급업체는 쿠키를 사용하여 이용자의 이전 방문 기록을 바탕으로 광고를
            게재합니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              Google의 광고 쿠키를 통해 Google과 광고 파트너는 이 사이트 및 다른 사이트 방문 정보를
              기반으로 맞춤형 광고를 제공할 수 있습니다.
            </li>
            <li>
              이용자는{" "}
              <a
                className="text-accent underline"
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google 광고 설정
              </a>
              에서 맞춤형 광고를 거부할 수 있습니다.
            </li>
            <li>
              제3자 공급업체의 쿠키 사용에 대한 자세한 내용은{" "}
              <a
                className="text-accent underline"
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google 광고 정책
              </a>
              을 참고하세요.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">3. 분석 도구</h2>
          <p className="mt-2">
            서비스 개선을 위해 익명화된 트래픽 분석 도구를 사용할 수 있으며, 이때 수집되는 정보는
            개인을 식별하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">4. 외부 링크</h2>
          <p className="mt-2">
            본 사이트의 기사 링크는 외부 매체로 연결됩니다. 외부 사이트의 개인정보 처리에 대해서는
            해당 사이트의 정책이 적용되며, TBD Times 는 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink">5. 문의</h2>
          <p className="mt-2">
            개인정보 처리방침에 대한 문의는 이메일로 연락해 주시기 바랍니다.{" "}
            <a className="text-accent underline" href="mailto:dr.derek.ji@gmail.com">
              dr.derek.ji@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
