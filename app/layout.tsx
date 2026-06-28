import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TBD Times — 매일 아침 AI·투자 뉴스 브리핑",
    template: "%s · TBD Times",
  },
  description:
    "전세계 AI·인공지능과 투자·금융 뉴스를 매일 아침 자동으로 모아 한눈에 보여주는 데일리 브리핑.",
  keywords: ["AI 뉴스", "인공지능", "투자 뉴스", "증시", "주식", "테크 뉴스", "데일리 브리핑"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "TBD Times",
    title: "TBD Times — 매일 아침 AI·투자 뉴스 브리핑",
    description: "전세계 AI·투자 소식을 매일 아침 한눈에.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "TBD Times — 매일 아침 AI·투자 뉴스 브리핑",
    description: "전세계 AI·투자 소식을 매일 아침 한눈에.",
  },
  robots: { index: true, follow: true },
  // AdSense 사이트 소유 확인용 메타 (퍼블리셔 ID 설정 시 자동 삽입)
  other: adsenseClient ? { "google-adsense-account": adsenseClient } : {},
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "TBD Times",
      url: siteUrl,
      description:
        "전세계 AI·투자·코인 뉴스를 매일 아침 자동으로 모아 전하는 한국어 데일리 뉴스 브리핑.",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "TBD Times",
      inLanguage: "ko-KR",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Google AdSense 사이트 확인 + 광고 로더 (퍼블리셔 ID 설정 시에만 삽입) */}
        {adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
