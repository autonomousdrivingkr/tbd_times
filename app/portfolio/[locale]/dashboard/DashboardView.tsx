"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import DashboardCharts, { type AssetSlice, type MonthlyBar } from "./DashboardCharts";

type DisplayCurrency = "KRW" | "USD";
type HoldingSortKey = "shares" | "cost" | "value" | "ret" | "dividendYield";
type SortDir = "asc" | "desc";

interface Asset {
  symbol: string;
  shares: number;
  avgCost: number;
  currency: string;
}

interface Portfolio {
  id: string;
  name: string;
  currency: string;
  assets: Asset[];
}

interface QuoteData {
  price: number;
  currency: string;
  dividendYield?: number;
  dividendEvents?: { date: number; amountPerShare: number }[];
  name?: string;
}

interface Props {
  portfolios: Portfolio[];
  quotes: Record<string, QuoteData>;
  usdKrw: number | null;
  title: string;
  labelTotalValue: string;
  labelTotalProfit: string;
  labelTotalReturn: string;
  labelDividendYield: string;
  labelMyPortfolios: string;
  labelCreatePortfolio: string;
  labelNoPortfolio: string;
  labelAllocation: string;
  labelMonthlyDividends: string;
  labelTotal: string;
  labelOther: string;
  labelAnnualTotal: string;
  labelHoldingsSummary: string;
  labelAssetName: string;
  labelAssetSymbol: string;
  labelShares: string;
  labelCost: string;
  labelValue: string;
  labelReturn: string;
}

// 국내 거래소 접미사는 Yahoo Finance 심볼 형식일 뿐 사람이 알아볼 필요는 없어
// 표시에서만 뗀다(자산 상세 표와 동일한 규칙).
function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(KS|KQ)$/, "");
}

const CUR_SYM: Record<string, string> = { KRW: "₩", USD: "$", JPY: "¥", EUR: "€", GBP: "£" };

export default function DashboardView({
  portfolios, quotes, usdKrw,
  title, labelTotalValue, labelTotalProfit, labelTotalReturn, labelDividendYield,
  labelMyPortfolios, labelCreatePortfolio, labelNoPortfolio,
  labelAllocation, labelMonthlyDividends, labelTotal, labelOther, labelAnnualTotal,
  labelHoldingsSummary, labelAssetName, labelAssetSymbol, labelShares, labelCost, labelValue, labelReturn,
}: Props) {
  const locale = useLocale();
  const [displayCur, setDisplayCur] = useState<DisplayCurrency>("KRW");
  const [holdingsSortKey, setHoldingsSortKey] = useState<HoldingSortKey>("value");
  const [holdingsSortDir, setHoldingsSortDir] = useState<SortDir>("desc");

  function handleHoldingsSort(key: HoldingSortKey) {
    if (holdingsSortKey === key) {
      setHoldingsSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setHoldingsSortKey(key);
      setHoldingsSortDir("desc");
    }
  }

  function convert(amount: number, fromCur: string): number {
    if (!isFinite(amount)) return NaN;
    if (fromCur === displayCur) return amount;
    if (!usdKrw) return NaN;
    const inUsd =
      fromCur === "USD" ? amount :
      fromCur === "KRW" ? amount / usdKrw : NaN;
    if (isNaN(inUsd)) return NaN;
    return displayCur === "USD" ? inUsd : inUsd * usdKrw;
  }

  const sym = CUR_SYM[displayCur] ?? displayCur;

  function fmtNum(n: number) {
    if (!isFinite(n)) return "—";
    return displayCur === "KRW"
      ? n.toLocaleString("ko-KR", { maximumFractionDigits: 0 })
      : n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  let totalValue = 0, totalCost = 0, annualDividend = 0;
  for (const p of portfolios) {
    for (const a of p.assets) {
      const q = quotes[a.symbol];
      const price = q ? convert(q.price, q.currency) : NaN;
      const cost  = convert(a.avgCost, a.currency);
      if (isFinite(price)) totalValue += price * a.shares;
      if (isFinite(cost))  totalCost  += cost  * a.shares;
      if (q?.dividendYield && isFinite(price)) {
        annualDividend += price * (q.dividendYield / 100) * a.shares;
      }
    }
  }
  const totalProfit = totalValue - totalCost;
  const totalReturn = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const dividendYieldPct = totalValue > 0 ? (annualDividend / totalValue) * 100 : 0;

  // 종목별 합산(여러 포트폴리오에 걸쳐 같은 종목을 보유한 경우 하나로 묶음) —
  // 자산 배분 도넛차트와 하단 보유 종목 표가 이 집계를 함께 쓴다. 상위 15개 +
  // 나머지는 "기타"(도넛 전용, 팔레트는 15개 슬롯까지 있지만 매 슬라이스가
  // 범례에 이름과 함께 표시되므로 9번째부터는 색만으로 완전히 구분될 필요는 없다).
  interface HoldingAgg { symbol: string; name: string; shares: number; cost: number; value: number; dividendYield?: number }
  const holdingsBySymbol: Record<string, HoldingAgg> = {};
  for (const p of portfolios) {
    for (const a of p.assets) {
      const q = quotes[a.symbol];
      const price = q ? convert(q.price, q.currency) : NaN;
      const cost = convert(a.avgCost, a.currency);
      if (!holdingsBySymbol[a.symbol]) {
        holdingsBySymbol[a.symbol] = { symbol: a.symbol, name: q?.name ?? a.symbol, shares: 0, cost: 0, value: 0, dividendYield: q?.dividendYield };
      }
      const h = holdingsBySymbol[a.symbol];
      h.shares += a.shares;
      if (isFinite(cost)) h.cost += cost * a.shares;
      if (isFinite(price)) h.value += price * a.shares;
    }
  }
  const sortedHoldings = Object.values(holdingsBySymbol).sort((a, b) => b.value - a.value);
  const topHoldings = sortedHoldings.slice(0, 15);
  const otherValue = sortedHoldings.slice(15).reduce((sum, h) => sum + h.value, 0);
  const assetSlices: AssetSlice[] = topHoldings.map(({ name, value }) => ({
    label: name,
    value,
    pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }));
  if (otherValue > 0) {
    assetSlices.push({ label: labelOther, value: otherValue, pct: totalValue > 0 ? (otherValue / totalValue) * 100 : 0 });
  }

  // 월별 배당금(바차트) — 실제 배당 지급일 기준(균등 분배 아님), 최근 1년 실적을
  // 달력월(1~12월)에 매핑해 "보통 이맘때 배당이 들어온다"를 보여준다.
  const monthlyAmounts = Array<number>(12).fill(0);
  for (const p of portfolios) {
    for (const a of p.assets) {
      const q = quotes[a.symbol];
      if (!q?.dividendEvents) continue;
      for (const ev of q.dividendEvents) {
        const perShare = convert(ev.amountPerShare, q.currency);
        if (!isFinite(perShare)) continue;
        const month = new Date(ev.date * 1000).getMonth();
        monthlyAmounts[month] += perShare * a.shares;
      }
    }
  }
  const monthlyBars: MonthlyBar[] = monthlyAmounts.map((amount, month) => ({ month, amount }));

  // 보유 종목 표는 도넛차트의 고정 정렬(평가금액 내림차순)과 별도로 사용자가
  // 선택한 컬럼 기준으로 정렬한다.
  interface HoldingRow extends HoldingAgg { ret: number | null }
  function holdingSortValue(h: HoldingRow, key: HoldingSortKey): number {
    switch (key) {
      case "shares": return h.shares;
      case "cost": return h.cost;
      case "value": return h.value;
      case "ret": return h.ret ?? -Infinity;
      case "dividendYield": return h.dividendYield ?? -Infinity;
    }
  }
  const holdingRows: HoldingRow[] = sortedHoldings.map((h) => ({
    ...h,
    ret: h.cost > 0 ? ((h.value - h.cost) / h.cost) * 100 : null,
  }));
  const displayedHoldings = [...holdingRows].sort((a, b) => {
    const av = holdingSortValue(a, holdingsSortKey);
    const bv = holdingSortValue(b, holdingsSortKey);
    return holdingsSortDir === "desc" ? bv - av : av - bv;
  });

  function HoldingsSortBtn({ col, label }: { col: HoldingSortKey; label: string }) {
    const active = holdingsSortKey === col;
    return (
      <button
        onClick={() => handleHoldingsSort(col)}
        className={`inline-flex items-center gap-1 hover:text-ink-soft transition-colors ${active ? "text-accent" : "text-muted"}`}
      >
        {label}
        <span className="flex flex-col leading-none ml-0.5">
          <svg className={`w-2.5 h-2.5 -mb-0.5 ${active && holdingsSortDir === "asc" ? "text-accent" : "text-line"}`} fill="currentColor" viewBox="0 0 10 6">
            <path d="M5 0L10 6H0z" />
          </svg>
          <svg className={`w-2.5 h-2.5 ${active && holdingsSortDir === "desc" ? "text-accent" : "text-line"}`} fill="currentColor" viewBox="0 0 10 6">
            <path d="M5 6L0 0h10z" />
          </svg>
        </span>
      </button>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">{title}</h1>
          <p className="text-sm text-muted mt-1">포트폴리오 현황을 한눈에 확인하세요</p>
        </div>
        {/* 통화 토글 */}
        <div className="flex items-center gap-3 shrink-0">
          {usdKrw && (
            <span className="text-xs text-muted hidden sm:block">
              1 USD = ₩{usdKrw.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}
            </span>
          )}
          <div className="flex bg-paper-2 rounded-xl p-1 gap-1 border border-line">
            {(["KRW", "USD"] as DisplayCurrency[]).map((c) => (
              <button
                key={c}
                onClick={() => setDisplayCur(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  displayCur === c
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-ink-soft"
                }`}
              >
                {c === "KRW" ? "₩ KRW" : "$ USD"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 차트: 자산 배분(도넛) + 월별 배당금(막대) — 숫자 요약보다 먼저 배치해
          전체 그림을 한눈에 보여준다 */}
      {totalValue > 0 && (
        <DashboardCharts
          assetSlices={assetSlices}
          monthlyBars={monthlyBars}
          totalValue={totalValue}
          currencySymbol={sym}
          fmtNum={fmtNum}
          labelAllocation={labelAllocation}
          labelMonthlyDividends={labelMonthlyDividends}
          labelTotal={labelTotal}
          labelAnnualTotal={labelAnnualTotal}
          labelDividendYield={labelDividendYield}
          dividendYieldPct={dividendYieldPct}
        />
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label={labelTotalValue}
          value={`${sym}${fmtNum(totalValue)}`}
          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
        />
        <StatCard
          label={labelTotalProfit}
          value={`${totalProfit >= 0 ? "+" : ""}${sym}${fmtNum(Math.abs(totalProfit))}`}
          positive={totalProfit >= 0}
          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label={labelTotalReturn}
          value={`${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`}
          positive={totalReturn >= 0}
          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <StatCard
          label={labelDividendYield}
          value={annualDividend > 0 ? `${dividendYieldPct.toFixed(2)}%` : "—"}
          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label={labelMyPortfolios}
          value={String(portfolios.length)}
          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
      </div>

      {/* 포트폴리오 목록 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink-soft">{labelMyPortfolios}</h2>
        <Link href={`/portfolio/${locale}/dashboard/portfolio`} className="text-sm text-accent hover:opacity-80 font-medium transition-opacity">
          {labelCreatePortfolio} →
        </Link>
      </div>

      {portfolios.length === 0 ? (
        <div className="bg-paper-2 rounded-2xl border border-line p-12 sm:p-16 text-center">
          <div className="w-14 h-14 bg-paper rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-ink-soft font-medium mb-1">{labelNoPortfolio}</p>
          <p className="text-muted text-sm mb-6">첫 포트폴리오를 만들고 자산을 추가해보세요</p>
          <Link href={`/portfolio/${locale}/dashboard/portfolio`} className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity">
            {labelCreatePortfolio}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolios.map((p) => {
            let pValue = 0, pCost = 0;
            for (const a of p.assets) {
              const q = quotes[a.symbol];
              const price = q ? convert(q.price, q.currency) : NaN;
              const cost  = convert(a.avgCost, a.currency);
              if (isFinite(price)) pValue += price * a.shares;
              if (isFinite(cost))  pCost  += cost  * a.shares;
            }
            const pProfit = pValue - pCost;
            const pReturn = pCost > 0 ? (pProfit / pCost) * 100 : 0;
            const positive = pReturn >= 0;

            return (
              <Link key={p.id} href={`/portfolio/${locale}/dashboard/portfolio/${p.id}`}>
                <div className="bg-paper-2 rounded-2xl border border-line p-6 hover:border-accent/40 transition-all group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-ink group-hover:text-accent transition-colors truncate">{p.name}</h3>
                      <p className="text-xs text-muted mt-0.5">{p.assets.length}개 종목</p>
                    </div>
                    <span className="text-xs font-medium bg-paper text-muted px-2 py-1 rounded-lg ml-3 shrink-0">{displayCur}</span>
                  </div>
                  <p className="text-2xl font-bold text-ink mb-3 truncate">
                    {sym}{fmtNum(pValue)}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                      {positive
                        ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                      {Math.abs(pReturn).toFixed(2)}%
                    </span>
                    <span className={`text-xs ${positive ? "text-emerald-600" : "text-red-600"}`}>
                      {positive ? "+" : "−"}{sym}{fmtNum(Math.abs(pProfit))}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 보유 종목 합산 — 여러 포트폴리오에 걸친 동일 종목을 하나로 묶어 보여준다 */}
      {sortedHoldings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-ink-soft mb-4">{labelHoldingsSummary}</h2>
          <div className="bg-paper-2 rounded-2xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="border-b border-line bg-paper">
                  <tr className="text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-4 text-muted">{labelAssetName}</th>
                    <th className="text-left px-5 py-4 text-muted">{labelAssetSymbol}</th>
                    <th className="text-right px-5 py-4">
                      <HoldingsSortBtn col="shares" label={labelShares} />
                    </th>
                    <th className="text-right px-5 py-4">
                      <HoldingsSortBtn col="cost" label={labelCost} /> <span className="normal-case font-normal text-muted">({displayCur})</span>
                    </th>
                    <th className="text-right px-5 py-4">
                      <HoldingsSortBtn col="value" label={labelValue} /> <span className="normal-case font-normal text-muted">({displayCur})</span>
                    </th>
                    <th className="text-right px-5 py-4">
                      <HoldingsSortBtn col="ret" label={labelReturn} />
                    </th>
                    <th className="text-right px-5 py-4">
                      <HoldingsSortBtn col="dividendYield" label={labelDividendYield} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {displayedHoldings.map((h) => (
                    <tr key={h.symbol} className="hover:bg-paper transition-colors">
                      <td className="px-5 py-4 text-ink-soft truncate max-w-[160px]">{h.name}</td>
                      <td className="px-5 py-4 font-semibold text-ink">{displaySymbol(h.symbol)}</td>
                      <td className="px-5 py-4 text-right text-ink-soft">{h.shares}</td>
                      <td className="px-5 py-4 text-right text-muted">
                        {h.cost > 0 ? `${sym}${fmtNum(h.cost)}` : <span className="text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-ink">
                        {h.value > 0 ? `${sym}${fmtNum(h.value)}` : <span className="text-xs">—</span>}
                      </td>
                      <td className={`px-5 py-4 text-right font-semibold ${
                        h.ret === null ? "text-muted" : h.ret >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {h.ret === null ? <span className="text-xs">—</span> : `${h.ret >= 0 ? "+" : ""}${h.ret.toFixed(2)}%`}
                      </td>
                      <td className="px-5 py-4 text-right text-ink-soft">
                        {h.dividendYield ? `${h.dividendYield.toFixed(2)}%` : <span className="text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, positive, icon }: {
  label: string; value: string; positive?: boolean;
  icon: React.ReactNode;
}) {
  const valueColor = positive === undefined ? "text-ink" : positive ? "text-emerald-600" : "text-red-600";
  return (
    <div className="bg-paper-2 rounded-2xl border border-line p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-muted leading-tight pr-2">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-accent-soft text-accent">{icon}</div>
      </div>
      <p className={`text-xl sm:text-2xl font-bold leading-tight break-words ${valueColor}`}>{value}</p>
    </div>
  );
}
