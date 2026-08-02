import { NextResponse } from "next/server";
import { auth } from "@/lib/portfolio/auth";
import { prisma } from "@/lib/portfolio/db";
import { getMultipleQuotes, getQuote } from "@/lib/portfolio/market";
import { getPortfolioCommentary } from "@/lib/portfolio/ai-commentary";

// 대시보드 서버 컴포넌트에서 이 호출을 직접 await 하면, LLM 폴백 체인이 전부
// 실패하는 상황(현재 Gemini·Groq·OpenRouter 쿼터 동시 소진 시)에 Gemini
// 타임아웃(25초) + 폴백 예산(24초)이 그대로 페이지 응답을 막아 대시보드
// 전체가 수십 초~수 분간 안 뜨는 것처럼 보이는 사고로 이어졌다. 코멘트는
// 장식적 기능이라 포트폴리오 핵심 데이터(자산·차트)와 분리해 클라이언트에서
// 별도로 fetch 하도록 뺐다 — 느리거나 실패해도 나머지 대시보드는 즉시 뜬다.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: session.user.id },
    include: { assets: true },
  });

  const allSymbols = portfolios.flatMap((p) => p.assets.map((a) => a.symbol));
  const quotes = allSymbols.length > 0
    ? await getMultipleQuotes([...new Set(allSymbols)])
    : {};

  const fxQuote = await getQuote("USDKRW=X");
  const usdKrw = fxQuote?.price ?? null;

  const commentary = await getPortfolioCommentary(portfolios, quotes, usdKrw);

  return NextResponse.json({ commentary });
}
