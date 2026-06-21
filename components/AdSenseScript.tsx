import Script from "next/script";

/**
 * AdSense 전역 로더. NEXT_PUBLIC_ADSENSE_CLIENT 가 설정된 경우에만 삽입된다.
 * <head> 에 들어가야 하므로 layout 에서 렌더한다.
 */
export default function AdSenseScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) return null;

  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}
