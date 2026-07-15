// Gemini API 요청 속도 제한 — 레인(lane)별로 독립된 큐 + 간격을 둔다.
//
// 처음에는 프로세스 전체가 큐 하나를 공유했는데, 번역(translate.ts)이 호출
// 빈도가 압도적으로 높다 보니 해설(analysis.ts)·브리핑(briefing.ts)·블로그
// 자동 초안(blog-generator.ts) 호출이 번역 트래픽에 밀려 429로 실패하는 일이
// 잦았다. 특히 해설 실패는 /news/[slug] 페이지가 noindex 처리되는 것으로
// 직결되므로(색인 가능 여부를 좌우) 번역보다 안정성이 훨씬 중요하다.
//
// 레인을 나누되 모델은 그대로 gemini-2.5-flash 를 공유한다(별도 모델로
// 분리를 시도했다가 gemini-2.5-flash-lite 가 이미 "신규 사용자에게 더 이상
// 제공되지 않는" 상태라 전체 번역이 깨지는 사고가 있었다 — 모델 가용성은
// 코드 밖에서 계속 바뀌므로, 검증되지 않은 모델명을 새로 도입하기보다 이미
// 이 프로젝트에서 검증된 모델을 쓰는 쪽이 안전하다). 같은 모델은 같은
// Google 쪽 쿼터를 쓰므로, 두 레인의 간격을 합쳐도 분당 한도(20회)를 넘지
// 않도록 보수적으로 나눠 배분한다:
//   - "primary"(해설·브리핑·자동초안): 8초 간격 → 분당 최대 7.5회
//   - "translate"(번역): 10초 간격 → 분당 최대 6회
//   - 합계 분당 최대 13.5회 — 기존 단일 레인 시절의 안전 마진(분당 약 13회)과
//     비슷한 수준을 유지하면서, translate 레인의 물량이 아무리 많아도 그와
//     무관하게 primary 레인이 최소 처리량을 보장받는다.
const LANE_INTERVAL_MS: Record<string, number> = {
  primary: 8000,
  translate: 10000,
};
const DEFAULT_INTERVAL_MS = 8000;

interface Lane {
  slotChain: Promise<void>;
  nextSlotAt: number;
}

const lanes = new Map<string, Lane>();

function getLane(name: string): Lane {
  let lane = lanes.get(name);
  if (!lane) {
    lane = { slotChain: Promise.resolve(), nextSlotAt: 0 };
    lanes.set(name, lane);
  }
  return lane;
}

/** 다음 Gemini 호출 슬롯을 예약한다. 같은 레인 안에서는 요청 순서대로 최소 간격을 둔다. */
export function reserveGeminiSlot(lane = "primary"): Promise<void> {
  const l = getLane(lane);
  const interval = LANE_INTERVAL_MS[lane] ?? DEFAULT_INTERVAL_MS;
  const next = l.slotChain.then(async () => {
    const wait = Math.max(0, l.nextSlotAt - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    l.nextSlotAt = Date.now() + interval;
  });
  l.slotChain = next;
  return next;
}

/** 429(RESOURCE_EXHAUSTED) 응답이 안내하는 재시도 대기 시간만큼 해당 레인의 다음 슬롯을 뒤로 미룬다. */
export function pushBackGeminiSlot(delayMs: number, lane = "primary") {
  const l = getLane(lane);
  l.nextSlotAt = Math.max(l.nextSlotAt, Date.now() + delayMs);
}

/** Gemini 429 응답 본문에서 "retry in Ns" 힌트를 파싱한다. 없으면 기본값(20s). */
export function parseRetryDelayMs(body: string): number {
  const m = body.match(/retry in ([\d.]+)s/i);
  const retrySec = m ? parseFloat(m[1]) : 20;
  return (retrySec + 1) * 1000;
}
