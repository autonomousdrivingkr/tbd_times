// Gemini API 요청 속도 제한 — 모델(레인)별로 독립된 큐를 둔다.
//
// 처음에는 프로세스 전체가 큐 하나를 공유했는데, 번역(translate.ts)이 호출
// 빈도가 가장 높다 보니 해설(analysis.ts)·브리핑(briefing.ts)·블로그 자동
// 초안(blog-generator.ts) 호출이 번역 트래픽에 밀려 429로 실패하는 일이 잦았다.
// 특히 해설 실패는 /news/[slug] 페이지가 noindex 처리되는 것으로 직결되므로
// (색인 가능 여부를 좌우) 번역보다 안정성이 훨씬 중요하다.
//
// 해결책: 번역은 별도 모델(GEMINI_TRANSLATE_MODEL, 기본 gemini-2.5-flash-lite)을
// 쓰도록 분리했다. 모델이 다르면 무료 티어 쿼터도 별도로 집계되므로, 레인을
// 나누는 것만으로 번역량이 아무리 많아도 해설/브리핑/자동초안 쿼터를 갉아먹지
// 않는다. 각 레인은 기존과 동일한 보수적 간격(20회/분 한도에 분당 약 13회)을
// 유지한다 — 간격 자체를 좁히는 건 하지 않는다(과거 재시도 로직이 요청을
// 지수적으로 늘려 빌드 전체가 크래시한 사고가 있었다. 안전 마진을 줄이는
// 방향의 변경은 하지 않는다).

const MIN_INTERVAL_MS = 4500;

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
  const next = l.slotChain.then(async () => {
    const wait = Math.max(0, l.nextSlotAt - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    l.nextSlotAt = Date.now() + MIN_INTERVAL_MS;
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
