"use client";

import { useState } from "react";

/**
 * 외부 RSS 썸네일은 깨지거나 차단되는 경우가 많다.
 * 로드 실패 시 그라데이션 자리표시로 자연스럽게 대체한다.
 */
export default function Thumb({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`bg-gradient-to-br from-line to-paper-2 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
