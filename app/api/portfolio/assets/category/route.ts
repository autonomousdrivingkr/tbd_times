import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/portfolio/auth";
import { prisma } from "@/lib/portfolio/db";
import { z } from "zod";

// 대시보드의 보유 종목 합산 표는 여러 포트폴리오에 걸친 동일 심볼을 하나로
// 묶어 보여준다 — 리밸런싱 분류도 사용자 입장에선 "이 종목"에 대한 하나의
// 판단이지 포트폴리오별로 다를 이유가 없다. 그래서 assetId 하나가 아니라
// symbol 단위로, 그 사용자의 모든 포트폴리오에 걸친 동일 심볼 자산 전체에
// 한 번에 적용한다.
const updateSchema = z.object({
  symbol: z.string().min(1),
  category: z.enum(["GROWTH_ENGINE", "DIVIDEND_GROWTH", "HIGH_YIELD_CASHCOW", "SAFE_ASSET"]).nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { symbol, category } = parsed.data;

  const result = await prisma.asset.updateMany({
    where: { symbol, portfolio: { userId: session.user.id } },
    data: { rebalanceCategory: category },
  });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ symbol, category });
}
