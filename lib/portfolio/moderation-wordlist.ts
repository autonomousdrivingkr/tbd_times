// 게시판 글 등록 시점에 동기적으로 대조하는 1차 방어선(비속어 블록리스트).
// Gemini 호출 없이 즉시 판단하므로 쿼터 걱정 없이 항상 적용된다.
// 여기 없는 표현은 lib/portfolio/moderation.ts 의 Gemini 비동기 검사가
// 2차로 걸러낸다.

const BLOCKLIST: string[] = [
  "씨발", "씹할", "개새끼", "병신", "지랄", "좆", "닥쳐", "미친놈", "미친년",
  "fuck", "fucking", "bitch", "asshole", "bastard", "cunt",
];

// Unicode 정규화(NFKC) + 소문자화 + 공백/구두점 제거 — "씨 발", "F.U.C.K" 같은
// 흔한 우회 표기를 막기 위함.
function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]/gu, "");
}

const NORMALIZED_BLOCKLIST = BLOCKLIST.map(normalize);

export function containsBlockedContent(text: string): boolean {
  const normalized = normalize(text);
  return NORMALIZED_BLOCKLIST.some((word) => word && normalized.includes(word));
}
