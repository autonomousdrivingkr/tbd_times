// LLM API 요청 속도 제한 — 레인(lane)별로 독립된 큐 + 간격을 둔다.
//
// 원래는 Gemini 전용이었다("gemini-throttle.ts"). 처음에는 프로세스 전체가
// 큐 하나를 공유했는데, 번역(translate.ts)이 호출 빈도가 압도적으로 높다
// 보니 해설(analysis.ts)·브리핑(briefing.ts)·블로그 자동 초안(blog-generator.ts)
// 호출이 번역 트래픽에 밀려 429로 실패하는 일이 잦았다. 특히 해설 실패는
// /news/[slug] 페이지가 noindex 처리되는 것으로 직결되므로(색인 가능 여부를
// 좌우) 번역보다 안정성이 훨씬 중요하다.
//
// Gemini 레인을 나누되 모델은 그대로 gemini-2.5-flash 를 공유한다(별도 모델로
// 분리를 시도했다가 gemini-2.5-flash-lite 가 이미 "신규 사용자에게 더 이상
// 제공되지 않는" 상태라 전체 번역이 깨지는 사고가 있었다 — 모델 가용성은
// 코드 밖에서 계속 바뀌므로, 검증되지 않은 모델명을 새로 도입하기보다 이미
// 이 프로젝트에서 검증된 모델을 쓰는 쪽이 안전하다). 같은 모델은 같은
// Google 쪽 쿼터를 쓰므로, Gemini 레인들의 간격을 합쳐도 분당 한도(20회)를
// 최대한 넘지 않도록 보수적으로 나눠 배분한다:
//   - "primary"(해설·브리핑·자동초안): 8초 간격 → 분당 최대 7.5회
//   - "translate"(번역): 10초 간격 → 분당 최대 6회
//   - "moderation"(게시판 글 자동 검열): 15초 간격 → 분당 최대 4회
//   - "commentary"(포트폴리오 AI 코멘트): 20초 간격 → 분당 최대 3회
//
// Gemini 하드 캡(분당 20회) 자체는 레인을 아무리 잘 나눠도 늘어나지 않는다.
// 그래서 lib/llm-client.ts 가 Gemini 실패 시 Groq·Cerebras·DeepSeek·OpenRouter
// 로 폴백하는 다중 프로바이더 체인을 두고, 이 파일도 그에 맞춰 일반화됐다
// (gemini-throttle.ts → llm-throttle.ts). 폴백 프로바이더들은 Gemini와 쿼터가
// 독립적이라 기능별로 레인을 또 나눌 필요가 없다 — 프로바이더 하나당
// 레인 하나("groq"/"cerebras"/"deepseek"/"openrouter")면 충분하다. 폴백
// 트래픽 자체가 "Gemini가 이미 실패했을 때만" 발생하는 저빈도 트래픽이라,
// Gemini 레인 분리를 정당화했던 "고빈도 기능이 저빈도 기능을 굶주리게
// 하는" 문제가 여기엔 적용되지 않는다. 아래 4개 폴백 레인의 간격 값은
// 아직 실사용 데이터가 없는 보수적인 추정값이다 — 실제 키를 발급받아
// 트래픽을 받아보면서 조정할 것.
const LANE_INTERVAL_MS: Record<string, number> = {
  primary: 8000,
  translate: 10000,
  moderation: 15000,
  commentary: 20000,
  groq: 3000,
  cerebras: 3000,
  deepseek: 5000,
  openrouter: 5000,
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

/** 다음 LLM 호출 슬롯을 예약한다. 같은 레인 안에서는 요청 순서대로 최소 간격을 둔다. */
export function reserveLlmSlot(lane = "primary"): Promise<void> {
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

/** 429 응답이 안내하는 재시도 대기 시간만큼 해당 레인의 다음 슬롯을 뒤로 미룬다. */
export function pushBackLlmSlot(delayMs: number, lane = "primary") {
  const l = getLane(lane);
  l.nextSlotAt = Math.max(l.nextSlotAt, Date.now() + delayMs);
}

/** Gemini 429 응답 본문에서 "retry in Ns" 힌트를 파싱한다(구글 특유 문구). 없으면 기본값(20s). */
export function parseRetryDelayMs(body: string): number {
  const m = body.match(/retry in ([\d.]+)s/i);
  const retrySec = m ? parseFloat(m[1]) : 20;
  return (retrySec + 1) * 1000;
}

/**
 * OpenAI 호환 폴백 프로바이더(Groq·Cerebras·DeepSeek·OpenRouter)의 429 응답에서
 * 표준 Retry-After 헤더를 읽는다. 이 프로바이더들의 실제 429 응답 형태를 아직
 * 한 번도 관측하지 못해 Gemini처럼 본문 문구를 파싱할 근거가 없다 — 표준
 * 헤더만 신뢰하고, 없으면 보수적인 고정값(15초)을 쓴다.
 */
export function parseRetryAfterHeader(res: Response): number {
  const header = res.headers.get("retry-after");
  if (!header) return 15000;
  const sec = parseFloat(header);
  if (!isFinite(sec) || sec < 0) return 15000;
  return (sec + 1) * 1000;
}
