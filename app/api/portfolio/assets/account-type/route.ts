import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/portfolio/auth";
import { prisma } from "@/lib/portfolio/db";
import { z } from "zod";

// lib/portfolio/assets/category 와 동일한 이유로 symbol 단위로 적용한다 —
// 대시보드의 보유 종목 합산 표가 여러 포트폴리오에 걸친 동일 심볼을 하나로
// 묶어 보여주므로, 계좌 구분도 그 사용자의 모든 포트폴리오에 걸친 동일
// 심볼 자산 전체에 한 번에 반영한다.
const updateSchema = z.object({
  symbol: z.string().min(1),
  accountType: z.enum(["GENERAL", "ISA", "PENSION_SAVINGS", "IRP", "RETIREMENT_PENSION_IRP"]).nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { symbol, accountType } = parsed.data;

  const result = await prisma.asset.updateMany({
    where: { symbol, portfolio: { userId: session.user.id } },
    data: { accountType },
  });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ symbol, accountType });
}
