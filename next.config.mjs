/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 시 여러 페이지가 Gemini 무료 티어(분당 20회) 한도에 걸리면
  // gemini-throttle 이 다음 슬롯을 최대 ~59초씩 미룬다. 기본 타임아웃(60초)이면
  // 슬롯을 기다리던 페이지 정적 생성이 "Export encountered an error" 로 크래시해
  // 빌드 전체가 실패한다. 번역은 실패 시 원문으로 폴백되므로, 페이지가 죽지 않고
  // 슬롯을 끝까지 기다릴 수 있도록 페이지 생성 타임아웃을 넉넉히 늘린다.
  staticPageGenerationTimeout: 300,
  images: {
    // RSS 썸네일은 다양한 외부 도메인에서 오므로 원격 패턴을 폭넓게 허용한다.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      // 코인 섹션을 투자에 통합 — 기존 /crypto 링크 보존
      { source: "/crypto", destination: "/investment", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
