"use client";

import { useEffect, useRef } from "react";

type AdSlotProps = {
  /** AdSense 광고 단위 슬롯 ID */
  slot?: string;
  /** 광고 포맷 (기본: 반응형 auto) */
  format?: string;
  /** 라벨 (자리표시용) */
  label?: string;
  className?: string;
  /** 가로형 배너 강제 여부 */
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({
  slot,
  format = "auto",
  label = "Advertisement",
  className = "",
  fullWidthResponsive = true,
  style,
}: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* 광고 차단기 등으로 실패해도 페이지에는 영향 없음 */
    }
  }, [client, slot]);

  // 광고가 설정되지 않았을 때는 점선 자리표시로 레이아웃을 미리 보여준다.
  if (!client || !slot) {
    return (
      <div
        className={`ad-placeholder flex items-center justify-center rounded-md text-xs uppercase tracking-widest ${className}`}
        style={{ minHeight: 110, ...style }}
        aria-hidden="true"
      >
        광고 영역 · AdSense
      </div>
    );
  }

  return (
    <div className={className} aria-label={label} role="complementary">
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
