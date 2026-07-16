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

  return (
    <DashboardView
      portfolios={portfolios}
      quotes={quotes}
      usdKrw={usdKrw}
      title={t("dashboard.title")}
      labelTotalValue={t("dashboard.totalValue")}
      labelTotalProfit={t("dashboard.totalProfit")}
      labelTotalReturn={t("dashboard.totalReturn")}
      labelDividendYield={t("dashboard.dividendYield")}
      labelMyPortfolios={t("dashboard.myPortfolios")}
      labelCreatePortfolio={t("dashboard.createPortfolio")}
      labelNoPortfolio={t("dashboard.noPortfolio")}
    />
  );
}
