/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // RSS 썸네일은 다양한 외부 도메인에서 오므로 원격 패턴을 폭넓게 허용한다.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
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
