import {
  PROVIDERS,
  isProviderConfigured,
  getApiKey,
  getModel,
  buildRequest,
  extractText,
  type ProviderConfig,
  type ProviderId,
} from "./llm-providers";
import { reserveLlmSlot, pushBackLlmSlot, parseRetryDelayMs, parseRetryAfterHeader } from "./llm-throttle";

// 7개 기능(해설·번역·브리핑·블로그 자동초안·맛집 소개글·포트폴리오 AI 코멘트·
// 게시판 모더레이션)이 공통으로 쓰는 단일 진입점. Gemini를 우선 시도하고,
// 실패하면(네트워크 오류·비정상 상태코드·빈 응답·JSON 파싱 실패 등) 설정된
// 다음 프로바이더로 넘어간다. 설정된 프로바이더가 하나도 없으면(오늘의 기본
// 상태 — Gemini 키만 있거나 그마저 없는 경우) 네트워크 호출 없이 즉시
// "disabled"를 반환한다. 이건 각 기능 파일의 기존 `if (!apiKey) return null`과
// 동일한 자리를 대체한다 — 호출자는 이 값을 캐시 가능한 "정상적으로 비활성화됨"
// 상태로 취급하면 된다. 반대로 설정된 프로바이더가 하나 이상 있는데 전부
// 실패하면 LLMAllProvidersFailedError를 던진다 — 호출자는 이걸 자기 파일의
// 기존 *Error 서브클래스로 다시 감싸서, unstable_cache가 실패를 캐시하지
// 않고 다음 요청에서 재시도하게 만든다(기존 관례 그대로).

export class LLMAllProvidersFailedError extends Error {}

export interface GenerateJsonParams {
  /** 로그 태그 겸 원인 추적용 — 기능 이름(예: "analysis", "translate", "moderation") */
  feature: string;
  /** Gemini 전용 레인 이름. 기본값은 reserveLlmSlot의 기본값과 동일하게 "primary" */
  geminiLane?: string;
  prompt: string;
  temperature?: number;
  geminiSchema?: object;
  geminiSafetySettings?: object[];
  /** 각 기능 파일이 이미 튜닝해 둔 Gemini 타임아웃. 기본 25초 */
  geminiTimeoutMs?: number;
  /** 폴백 프로바이더 한 번 시도당 상한. 기본 9초 */
  fallbackTimeoutMs?: number;
}

export type GenerateJsonResult =
  | { kind: "disabled" }
  | { kind: "ok"; data: unknown; provider: ProviderId };

const DEFAULT_GEMINI_TIMEOUT_MS = 25000;
const DEFAULT_FALLBACK_TIMEOUT_MS = 9000;
// 폴백 전체(Gemini 제외)에 허용하는 총 예산. 매 시도마다 고정 타임아웃을 주는
// 대신 이 예산을 프로바이더 수만큼 나눠 쓰게 해서, 나중에 폴백 프로바이더가
// 늘어나도 최악의 경우 전체 지연시간이 상수로 유지되게 한다.
const FALLBACK_BUDGET_MS = 24000;

export async function generateJson(params: GenerateJsonParams): Promise<GenerateJsonResult> {
  const configured = PROVIDERS.filter(isProviderConfigured);
  if (configured.length === 0) return { kind: "disabled" };

  const fallbackTimeoutMs = params.fallbackTimeoutMs ?? DEFAULT_FALLBACK_TIMEOUT_MS;
  const fallbackDeadline = Date.now() + FALLBACK_BUDGET_MS;

  for (const provider of configured) {
    const isGemini = provider.kind === "gemini";
    const lane = isGemini ? params.geminiLane ?? "primary" : provider.id;

    if (!isGemini && Date.now() >= fallbackDeadline) {
      console.error(`[llm:${params.feature}:${provider.id}] skipped (fallback budget exhausted)`);
      continue;
    }

    const timeoutMs = isGemini
      ? params.geminiTimeoutMs ?? DEFAULT_GEMINI_TIMEOUT_MS
      : Math.max(1000, Math.min(fallbackTimeoutMs, fallbackDeadline - Date.now()));

    const data = await callProvider(provider, lane, timeoutMs, params);
    if (data === undefined) continue; // 이 프로바이더 실패 — 다음으로
    if (!isGemini) {
      // 폴백이 실제로 발동해 성공한 흔치 않은 경우만 남긴다 — Gemini 성공은
      // 압도적으로 흔한 정상 경로라 매번 로그를 남기면 소음만 커진다. 이
      // 로그가 있어야 나중에 실제 폴백 키를 넣고 라이브 검증할 때 어떤
      // 프로바이더가 응답했는지 바로 확인할 수 있다.
      console.log(`[llm:${params.feature}:${provider.id}] fallback succeeded`);
    }
    return { kind: "ok", data, provider: provider.id };
  }

  throw new LLMAllProvidersFailedError(`all configured providers failed for ${params.feature}`);
}

/** 실패하면 undefined 를 반환한다(예외를 던지지 않음 — 호출자가 다음 프로바이더로 넘어갈 수 있도록). */
async function callProvider(
  provider: ProviderConfig,
  lane: string,
  timeoutMs: number,
  params: GenerateJsonParams
): Promise<unknown> {
  const tag = `[llm:${params.feature}:${provider.id}]`;
  const apiKey = getApiKey(provider);
  const model = getModel(provider);
  const req = buildRequest(provider, apiKey, model, {
    prompt: params.prompt,
    temperature: params.temperature,
    geminiSchema: params.geminiSchema,
    geminiSafetySettings: params.geminiSafetySettings,
  });

  await reserveLlmSlot(lane);

  let res: Response;
  try {
    res = await fetch(req.url, {
      method: "POST",
      headers: req.headers,
      body: req.body,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    console.error(`${tag} fetch failed`, err);
    return undefined;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`${tag} status ${res.status}`, body.slice(0, 500));
    if (res.status === 429) {
      const delay = provider.kind === "gemini" ? parseRetryDelayMs(body) : parseRetryAfterHeader(res);
      pushBackLlmSlot(delay, lane);
    }
    return undefined;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    console.error(`${tag} invalid response body`, err);
    return undefined;
  }

  const text = extractText(provider, json);
  if (!text) {
    console.error(`${tag} empty response`);
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error(`${tag} bad json`, text.slice(0, 300));
    return undefined;
  }
}
