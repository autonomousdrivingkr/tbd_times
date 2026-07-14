// Vercel Blob(@vercel/blob SDK)은 두 방식 중 하나로 인증한다:
// 1) BLOB_READ_WRITE_TOKEN — 고정 토큰을 직접 발급해 환경변수로 설정하는 방식(레거시).
// 2) VERCEL_OIDC_TOKEN + BLOB_STORE_ID — 프로젝트에 Blob 스토어를 연결하면 Vercel 이
//    배포마다 자동으로 주입하는 OIDC 페더레이션 방식(별도 토큰 발급이 필요 없음).
// SDK 가 내부적으로 이 둘을 자동 선택하므로, 여기서는 "둘 중 하나라도 있는가"만
// 확인해 로컬 개발(둘 다 없음)에서만 관련 기능을 조용히 비활성화한다.
// (BLOB_READ_WRITE_TOKEN 유무만 보면 OIDC 방식으로 연결된 스토어를 오탐지로
// "미연결"이라 판단해 기능이 켜지지 않는 문제가 있었다.)
export function hasBlobAccess(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  return Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
}
