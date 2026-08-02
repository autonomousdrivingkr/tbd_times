import { auth } from "@/lib/portfolio/auth";
import { prisma } from "@/lib/portfolio/db";
import { getTranslations } from "next-intl/server";
import { getMultipleQuotes, getQuote } from "@/lib/portfolio/market";
import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  const t = await getTranslations();
  const session = await auth();

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: session!.user!.id! },
    include: { assets: true },
  });

  const allSymbols = portfolios.flatMap((p) => p.assets.map((a) => a.symbol));
  const quotes = allSymbols.length > 0
    ? await getMultipleQuotes([...new Set(allSymbols)])
    : {};

  // 환율
  const fxQuote = await getQuote("USDKRW=X");
  const usdKrw = fxQuote?.price ?? null;

  // AI 코멘트는 여기서 await 하지 않는다 — /api/portfolio/ai-commentary 에서
  // 클라이언트가 별도로 가져온다(사유: DashboardView.tsx 주석 참고).
  return (
    <DashboardView
      portfolios={portfolios}
      quotes={quotes}
      usdKrw={usdKrw}
      labelAiCommentaryTitle={t("dashboard.aiCommentaryTitle")}
      labelAiCommentaryStrengths={t("dashboard.aiCommentaryStrengths")}
      labelAiCommentaryRisks={t("dashboard.aiCommentaryRisks")}
      labelAiCommentaryDisclaimer={t("dashboard.aiCommentaryDisclaimer")}
      title={t("dashboard.title")}
      labelTotalValue={t("dashboard.totalValue")}
      labelTotalProfit={t("dashboard.totalProfit")}
      labelTotalReturn={t("dashboard.totalReturn")}
      labelDividendYield={t("dashboard.dividendYield")}
      labelMyPortfolios={t("dashboard.myPortfolios")}
      labelCreatePortfolio={t("dashboard.createPortfolio")}
      labelNoPortfolio={t("dashboard.noPortfolio")}
      labelAllocation={t("dashboard.allocation")}
      labelMonthlyDividends={t("dashboard.monthlyDividends")}
      labelTotal={t("dashboard.total")}
      labelOther={t("dashboard.other")}
      labelAnnualTotal={t("dashboard.annualTotal")}
      labelHoldingsSummary={t("dashboard.holdingsSummary")}
      labelRebalanceAllocation={t("dashboard.rebalanceAllocation")}
      labelCategoryColumn={t("dashboard.categoryColumn")}
      labelCategoryGrowthEngine={t("dashboard.categoryGrowthEngine")}
      labelCategoryDividendGrowth={t("dashboard.categoryDividendGrowth")}
      labelCategoryHighYieldCashcow={t("dashboard.categoryHighYieldCashcow")}
      labelCategorySafeAsset={t("dashboard.categorySafeAsset")}
      labelCategoryUnclassified={t("dashboard.categoryUnclassified")}
      labelAssetName={t("asset.name")}
      labelAssetSymbol={t("asset.symbol")}
      labelShares={t("asset.shares")}
      labelCost={t("portfolio.cost")}
      labelValue={t("portfolio.value")}
      labelReturn={t("portfolio.return")}
    />
  );
}
