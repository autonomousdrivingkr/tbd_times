// next build 실행 중에는 process.env.NEXT_PHASE === "phase-production-build" 이다
// (런타임 서버/ISR 재생성에서는 "phase-production-server", 개발 서버에서는
//  "phase-development-server"). 빌드 단계에서 Gemini 번역/해설/브리핑을 호출하면
// 무료 티어 분당 요청 한도(20회/분)를 순식간에 소진해 빌드가 느려지거나 정적 생성
// 타임아웃으로 크래시한다. 그래서 빌드 때는 Gemini 호출을 건너뛰고 원문으로 렌더한 뒤,
// 번역은 런타임(ISR 재생성)에서만 수행한다. 이때 실패/스킵 결과를 캐시에 남기지 않아야
// 런타임에서 정상적으로 다시 생성된다.
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}
