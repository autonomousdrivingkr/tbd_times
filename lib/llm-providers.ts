// 다중 LLM 프로바이더 레지스트리 — Gemini가 실패하거나 쿼터를 초과했을 때
// 순서대로 시도할 폴백 체인의 설정과 요청/응답 어댑터를 담는다.
//
// ⚠️ Groq·Cerebras·DeepSeek·OpenRouter의 기본 모델명(defaultModel)은
// 전부 검증되지 않은 추정값이다. 이 프로젝트에는 검증 없이 모델명을
// 반영했다가(gemini-2.5-flash-lite) 실제로는 신규 사용자에게 제공되지
// 않는 모델이라 번역이 전면 중단된 사고가 있었다 — 동일한 실수를
// 반복하지 않으려면, 각 프로바이더의 실제 키를 발급받은 뒤 반드시
// curl 등으로 그 모델이 살아있는지 라이브로 확인하고 나서(.env의
// *_MODEL 값으로 즉시 교정 가능, 코드 변경 불필요) 의존해야 한다.

export type ProviderId = "gemini" | "groq" | "cerebras" | "deepseek" | "openrouter";

export interface ProviderConfig {
  id: ProviderId;
  envKeyVar: string;
  envModelVar: string;
  /** 미검증 추정값(Gemini 제외) — 위 경고 참고 */
  defaultModel: string;
  kind: "gemini" | "openai-chat";
  /** openai-chat: chat/completions 전체 URL. gemini: 모델명을 붙일 베이스 URL. */
  baseUrl: string;
}

// 고정 순서: Gemini(구조화 스키마 강제 가능, 이 프로젝트의 기본) →
// Groq·Cerebras(빠른 추론 전용 하드웨어) → DeepSeek → OpenRouter(여러 무료
// 모델을 모아둔 허브, 최후 수단).
export const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    envKeyVar: "GEMINI_API_KEY",
    envModelVar: "GEMINI_MODEL",
    defaultModel: "gemini-2.5-flash",
    kind: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  },
  {
    id: "groq",
    envKeyVar: "GROQ_API_KEY",
    envModelVar: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
    kind: "openai-chat",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    id: "cerebras",
    envKeyVar: "CEREBRAS_API_KEY",
    envModelVar: "CEREBRAS_MODEL",
    defaultModel: "llama-3.3-70b",
    kind: "openai-chat",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
  },
  {
    id: "deepseek",
    envKeyVar: "DEEPSEEK_API_KEY",
    envModelVar: "DEEPSEEK_MODEL",
    defaultModel: "deepseek-chat",
    kind: "openai-chat",
    baseUrl: "https://api.deepseek.com/v1/chat/completions",
  },
  {
    id: "openrouter",
    envKeyVar: "OPENROUTER_API_KEY",
    envModelVar: "OPENROUTER_MODEL",
    // 2026-07-27 라이브 확인: meta-llama/llama-3.3-70b-instruct:free 는
    // 더 이상 무료로 제공되지 않아(404, 유료 슬러그 안내) openai/gpt-oss-20b:free
    // 로 교체. JSON 모드·한국어 번역 품질 모두 실측 확인함(OpenRouter 무료
    // 모델 목록은 수시로 바뀌므로 이 값도 검증되지 않은 채 방치하면 다시
    // 깨질 수 있다 — 주기적으로 재확인 필요).
    defaultModel: "openai/gpt-oss-20b:free",
    kind: "openai-chat",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
  },
];

export function isProviderConfigured(p: ProviderConfig): boolean {
  return !!process.env[p.envKeyVar];
}

export function getApiKey(p: ProviderConfig): string {
  return process.env[p.envKeyVar]!;
}

export function getModel(p: ProviderConfig): string {
  return process.env[p.envModelVar] || p.defaultModel;
}

export interface LlmRequestOptions {
  prompt: string;
  temperature?: number;
  /** Gemini responseSchema 형태의 스키마(선택). Gemini는 그대로 강제 적용하고,
   *  OpenAI 호환 프로바이더는 이걸 사람이 읽는 힌트로 변환해 프롬프트에 덧붙인다. */
  geminiSchema?: object;
  /** Gemini 전용. 다른 프로바이더는 무시한다. */
  geminiSafetySettings?: object[];
}

export interface BuiltRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

function buildGeminiRequest(provider: ProviderConfig, apiKey: string, model: string, opts: LlmRequestOptions): BuiltRequest {
  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.4,
    responseMimeType: "application/json",
  };
  if (opts.geminiSchema) generationConfig.responseSchema = opts.geminiSchema;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: opts.prompt }] }],
    generationConfig,
  };
  if (opts.geminiSafetySettings) body.safetySettings = opts.geminiSafetySettings;

  return {
    url: `${provider.baseUrl}/${model}:generateContent?key=${apiKey}`,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function buildOpenAiChatRequest(provider: ProviderConfig, apiKey: string, model: string, opts: LlmRequestOptions): BuiltRequest {
  // OpenAI 호환 프로바이더는 Gemini의 responseSchema 강제를 지원하지 않는다
  // (기껏해야 "유효한 JSON" 정도만 강제하는 response_format: json_object).
  // 스키마가 있으면 사람이 읽을 수 있는 형태로 변환해 프롬프트 뒤에 덧붙인다
  // — 각 기능 파일이 직접 작성한 프롬프트 본문 자체는 그대로 두고, 이 힌트만
  // 순수하게 기계적으로 보강한다.
  const prompt = opts.geminiSchema
    ? `${opts.prompt}\n\n다음 형태의 JSON 객체로만 응답하세요:\n${schemaToHint(opts.geminiSchema)}`
    : opts.prompt;

  return {
    url: provider.baseUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: opts.temperature ?? 0.4,
      response_format: { type: "json_object" },
    }),
  };
}

export function buildRequest(provider: ProviderConfig, apiKey: string, model: string, opts: LlmRequestOptions): BuiltRequest {
  return provider.kind === "gemini"
    ? buildGeminiRequest(provider, apiKey, model, opts)
    : buildOpenAiChatRequest(provider, apiKey, model, opts);
}

function extractGeminiText(data: unknown): string | undefined {
  const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return d?.candidates?.[0]?.content?.parts?.[0]?.text;
}

function extractOpenAiChatText(data: unknown): string | undefined {
  const d = data as { choices?: { message?: { content?: string } }[] };
  return d?.choices?.[0]?.message?.content;
}

export function extractText(provider: ProviderConfig, data: unknown): string | undefined {
  return provider.kind === "gemini" ? extractGeminiText(data) : extractOpenAiChatText(data);
}

// Gemini 응답 스키마의 대문자 타입 표기.
interface GeminiSchemaShape {
  type: "OBJECT" | "STRING" | "ARRAY" | "BOOLEAN" | "INTEGER" | "NUMBER";
  properties?: Record<string, GeminiSchemaShape>;
  items?: GeminiSchemaShape;
}

function schemaToHintInner(schema: GeminiSchemaShape): string {
  switch (schema.type) {
    case "STRING":
      return "string";
    case "BOOLEAN":
      return "boolean";
    case "INTEGER":
    case "NUMBER":
      return "number";
    case "ARRAY":
      return `${schema.items ? schemaToHintInner(schema.items) : "any"}[]`;
    case "OBJECT": {
      const props = schema.properties ?? {};
      const lines = Object.entries(props).map(([k, v]) => `  ${k}: ${schemaToHintInner(v)}`);
      return `{\n${lines.join(",\n")}\n}`;
    }
    default:
      return "any";
  }
}

/** Gemini responseSchema 객체를 사람이 읽을 수 있는 필드 설명 텍스트로 기계적으로 변환한다. */
export function schemaToHint(schema: object): string {
  return schemaToHintInner(schema as GeminiSchemaShape);
}
