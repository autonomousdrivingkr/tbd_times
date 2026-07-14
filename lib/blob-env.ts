// Vercel Blob(@vercel/blob SDK)은 두 방식 중 하나로 인증한다:
// 1) BLOB_READ_WRITE_TOKEN — 고정 토큰을 직접 발급해 환경변수로 설정하는 방식(레거시).
// 2) BLOB_STORE_ID + OIDC 페더레이션 — 프로젝트에 Blob 스토어를 연결하면 Vercel 이
//    자동으로 주입하는 방식(별도 토큰 발급이 필요 없음).
//
// 처음에는 OIDC 토큰(VERCEL_OIDC_TOKEN)도 함께 확인했지만, 이 값은 짧은 수명의
// 동적 자격증명이라 매 요청마다 process.env 에 정적으로 잡힌다는 보장이 없다
// (실측 결과: put() 은 SDK 내부적으로 OIDC 인증에 성공해 정상 동작했는데, 같은
// 요청 문맥에서 VERCEL_OIDC_TOKEN 존재 여부로 게이트를 걸었던 readStore() 는
// 매번 조용히 빈 값을 반환했다 — 실제로는 접근 가능한데 이 체크가 거짓 음성을
// 낸 것). 대신 스토어가 연결되면 항상 정적으로 잡히는 BLOB_STORE_ID 유무만
// 확인한다: 로컬 개발(스토어 미연결, 둘 다 없음)에서만 조용히 비활성화되고,
// 프로덕션(스토어 연결됨)에서는 인증 방식과 무관하게 항상 true 를 반환한다.
export function hasBlobAccess(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
