/** @type {import('next').NextConfig} */
const nextConfig = {
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
