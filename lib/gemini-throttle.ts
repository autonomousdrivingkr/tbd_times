// Gemini API 프로세스 전역 요청 속도 제한.
// 무료 티어는 분당 요청 수가 제한(gemini-2.5-flash 기준 20회/분)되어 있어,
// 빌드 시 여러 페이지(투자·AI·여행·브리핑 등)가 동시에 번역/해설을 요청하면
// 순식간에 한도를 넘겨 배치가 통째로 429로 실패하고 영어 원문이 남는다.
// translate.ts·analysis.ts·briefing.ts 가 이 모듈을 함께 사용해 앱 전체의
// Gemini 호출을 하나의 큐로 직렬화한다.

// 20회/분 한도에 여유를 두고 분당 약 16회로 제한한다.
const MIN_INTERVAL_MS = 3800;
let slotChain: Promise<void> = Promise.resolve();
let nextSlotAt = 0;

/** 다음 Gemini 호출 슬롯을 예약한다. 호출들은 요청된 순서대로 최소 간격을 두고 진행된다. */
export function reserveGeminiSlot(): Promise<void> {
  const next = slotChain.then(async () => {
    const wait = Math.max(0, nextSlotAt - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    nextSlotAt = Date.now() + MIN_INTERVAL_MS;
  });
  slotChain = next;
  return next;
}

/** 429(RESOURCE_EXHAUSTED) 응답이 안내하는 재시도 대기 시간만큼 다음 슬롯을 뒤로 미룬다. */
export function pushBackGeminiSlot(delayMs: number) {
  nextSlotAt = Math.max(nextSlotAt, Date.now() + delayMs);
}

/** Gemini 429 응답 본문에서 "retry in Ns" 힌트를 파싱한다. 없으면 기본값(20s). */
export function parseRetryDelayMs(body: string): number {
  const m = body.match(/retry in ([\d.]+)s/i);
  const retrySec = m ? parseFloat(m[1]) : 20;
  return (retrySec + 1) * 1000;
}
