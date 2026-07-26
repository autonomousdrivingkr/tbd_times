import { generateJson } from "@/lib/llm-client";
import { prisma } from "@/lib/portfolio/db";

// 게시판 글의 2차 방어선(비동기). 블록리스트를 통과한 글이 게시된 "뒤에"
// LLM으로(기본 Gemini, 실패/쿼터초과 시 llm-client.ts 가 다른 프로바이더로
// 폴백) 인신공격·괴롭힘·혐오발언·스팸 여부를 판별한다. 단순히 비판적이거나
// 주제에서 벗어난 글은 걸러내지 않는다(오탐 최소화). 글마다 내용이 달라
// 재사용될 payload 가 없으므로 ai-commentary.ts 와 달리 캐싱하지 않는다.
// 실패해도(쿼터 초과 등) 글은 PUBLISHED 로 남는다(fail-open, 재시도 없음).

const MODERATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    flagged: { type: "BOOLEAN" },
    reason: { type: "STRING" },
  },
  required: ["flagged", "reason"],
};

interface ModerationResult {
  flagged: boolean;
  reason: string;
}

class ModerationError extends Error {}

async function callGemini(title: string, content: string): Promise<ModerationResult | null> {
  const prompt = [
    "당신은 커뮤니티 게시판 운영자입니다. 아래 게시글이 다음 중 하나에 해당하는지 판단하세요:",
    "- 특정 개인이나 집단에 대한 인신공격, 비방, 괴롭힘",
    "- 혐오 발언(성별·인종·출신·종교·장애 등에 대한 차별적 표현)",
    "- 명백한 스팸(광고 도배, 반복 게시)",
    "",
    "다음은 해당하지 않습니다 — 절대 flagged 로 판단하지 마세요:",
    "- 단순히 비판적이거나 부정적인 의견 (예: 특정 정책·서비스·기업에 대한 불만)",
    "- 주제에서 벗어난 글",
    "- 단순한 반말이나 거친 어투 그 자체(비속어·인신공격이 없다면)",
    "",
    "flagged: 위 세 가지 중 하나에 해당하면 true, 아니면 false.",
    "reason: flagged 가 true 인 경우 왜 그렇게 판단했는지 한 문장. false 인 경우 빈 문자열.",
    "JSON으로만 응답하세요.",
    "",
    "제목:",
    title,
    "",
    "본문:",
    content,
  ].join("\n");

  let result;
  try {
    result = await generateJson({
      feature: "moderation",
      geminiLane: "moderation",
      prompt,
      temperature: 0.2,
      geminiSchema: MODERATION_SCHEMA,
      geminiTimeoutMs: 25000,
    });
  } catch (err) {
    console.error("[moderation] llm request failed", err);
    throw new ModerationError("llm request failed");
  }
  if (result.kind === "disabled") return null;

  const parsed = result.data as ModerationResult;
  if (typeof parsed.flagged !== "boolean") {
    console.error("[moderation] incomplete", JSON.stringify(parsed).slice(0, 300));
    throw new ModerationError("gemini incomplete");
  }
  return parsed;
}

/**
 * 게시글을 Gemini 로 비동기 검사하고, flagged 면 REMOVED 로 상태를 갱신한다.
 * 절대 throw 하지 않는다 — 실패해도 글은 PUBLISHED 로 남는다(fail-open).
 */
export async function moderatePostAsync(postId: string, title: string, content: string): Promise<void> {
  let result: ModerationResult | null;
  try {
    result = await callGemini(title, content);
  } catch (err) {
    console.error("[moderation] moderatePostAsync failed", err);
    return;
  }
  if (!result || !result.flagged) return;

  try {
    // status: "PUBLISHED" 조건으로, 검사 결과가 오기 전에 작성자가 이미
    // 직접 삭제(user_delete)한 경우 removedReason 이 덮어써지는 것을 방지한다.
    await prisma.post.updateMany({
      where: { id: postId, status: "PUBLISHED" },
      data: {
        status: "REMOVED",
        removedReason: `moderation: ${result.reason || "정책 위반"}`.slice(0, 500),
      },
    });
  } catch (err) {
    console.error("[moderation] failed to update post status", err);
  }
}
