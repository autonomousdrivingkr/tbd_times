"use client";

import { useId, useMemo, useState } from "react";
import { useLocale } from "next-intl";

export interface AssetSlice {
  label: string;
  value: number;
  pct: number;
}

export interface MonthlyBar {
  month: number; // 0-11
  amount: number;
}

interface Props {
  assetSlices: AssetSlice[];
  monthlyBars: MonthlyBar[];
  totalValue: number;
  currencySymbol: string;
  fmtNum: (n: number) => string;
  labelAllocation: string;
  labelMonthlyDividends: string;
  labelTotal: string;
  labelAnnualTotal: string;
  labelDividendYield: string;
  dividendYieldPct: number;
}

// 검증된 8개 카테고리 색상(고정 순서) + 상위 8개를 넘는 종목을 위한 연한 톤 3개.
// 9~11번째는 범례에 이름이 항상 같이 표시되므로 색만으로 구분할 필요는 없다.
const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
  "var(--color-chart-9)",
  "var(--color-chart-10)",
  "var(--color-chart-11)",
];
const OTHER_COLOR = "var(--color-chart-other)";

function niceTicks(max: number, count = 4): number[] {
  if (!isFinite(max) || max <= 0) return [0];
  const rawStep = max / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceStep = residual > 5 ? 10 * magnitude : residual > 2 ? 5 * magnitude : residual > 1 ? 2 * magnitude : magnitude;
  const ticks: number[] = [];
  for (let v = 0; v <= max + niceStep * 0.5; v += niceStep) ticks.push(v);
  return ticks;
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegmentPath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number) {
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const p1 = polarPoint(cx, cy, rOuter, startDeg);
  const p2 = polarPoint(cx, cy, rOuter, endDeg);
  const p3 = polarPoint(cx, cy, rInner, endDeg);
  const p4 = polarPoint(cx, cy, rInner, startDeg);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

function AllocationDonut({
  slices,
  totalValue,
  currencySymbol,
  fmtNum,
  labelAllocation,
  labelTotal,
}: {
  slices: AssetSlice[];
  totalValue: number;
  currencySymbol: string;
  fmtNum: (n: number) => string;
  labelAllocation: string;
  labelTotal: string;
}) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const cx = 110, cy = 110, rOuter = 92, rInner = 58;
  const gapDeg = 1.6;

  let cursor = 0;
  const arcs = slices.map((s, i) => {
    const sweep = (s.pct / 100) * 360;
    const start = cursor + gapDeg / 2;
    const end = cursor + sweep - gapDeg / 2;
    cursor += sweep;
    return { ...s, start: Math.min(start, end), end: Math.max(start, end), color: i < CHART_COLORS.length ? CHART_COLORS[i] : OTHER_COLOR };
  });

  return (
    <div className="bg-paper-2 rounded-2xl border border-line p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-ink-soft mb-4">{labelAllocation}</h3>
      {slices.length === 0 ? (
        <p className="text-sm text-muted py-10 text-center">데이터가 없습니다</p>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative shrink-0" style={{ width: 240, height: 240 }}>
            <svg viewBox="0 0 220 220" width={240} height={240} role="img" aria-label={labelAllocation}>
              {arcs.map((a, i) => (
                <path
                  key={a.label}
                  d={donutSegmentPath(cx, cy, hover?.i === i ? rOuter + 3 : rOuter, rInner, a.start, a.end)}
                  fill={a.color}
                  className="transition-[d] duration-150 cursor-pointer outline-none"
                  tabIndex={0}
                  onMouseMove={(e) => setHover({ i, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHover((h) => (h?.i === i ? null : h))}
                  onFocus={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setHover({ i, x: r.left + r.width / 2, y: r.top });
                  }}
                  onBlur={() => setHover((h) => (h?.i === i ? null : h))}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
              <span className="text-xs text-muted">{labelTotal}</span>
              <span className="text-lg font-bold text-ink text-center leading-tight">
                {currencySymbol}{fmtNum(totalValue)}
              </span>
            </div>
          </div>

          {/* 범례 — 텍스트는 항상 ink/muted, 색은 스와치만 */}
          <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 min-w-0">
            {arcs.map((a) => (
              <div key={a.label} className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                <span className="text-sm text-ink-soft truncate">{a.label}</span>
                <span className="text-xs text-muted ml-auto shrink-0 tabular-nums">{a.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hover && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg bg-ink text-paper text-xs px-3 py-2 shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: hover.x, top: hover.y - 10 }}
        >
          <div className="font-semibold">{arcs[hover.i].label}</div>
          <div className="tabular-nums">{currencySymbol}{fmtNum(arcs[hover.i].value)} · {arcs[hover.i].pct.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}

function MonthlyDividendBars({
  bars,
  currencySymbol,
  fmtNum,
  label,
  labelAnnualTotal,
  labelDividendYield,
  dividendYieldPct,
}: {
  bars: MonthlyBar[];
  currencySymbol: string;
  fmtNum: (n: number) => string;
  label: string;
  labelAnnualTotal: string;
  labelDividendYield: string;
  dividendYieldPct: number;
}) {
  const locale = useLocale();
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const annualTotal = bars.reduce((sum, b) => sum + b.amount, 0);

  const monthLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "short" });
    return bars.map((b) => fmt.format(new Date(2026, b.month, 1)));
  }, [bars, locale]);

  const width = 640, height = 210, padLeft = 44, padBottom = 28, padTop = 24, padRight = 8;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const maxVal = Math.max(...bars.map((b) => b.amount), 0);
  const ticks = niceTicks(maxVal, 4);
  const scaleMax = ticks[ticks.length - 1] || 1;

  const barSlot = plotW / bars.length;
  const barWidth = Math.min(28, barSlot * 0.55);

  // 막대 위 라벨은 자리가 좁으니 축약 표기(1,234,000 → 1.2k)를 쓴다.
  const compactNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : fmtNum(n));

  return (
    <div className="bg-paper-2 rounded-2xl border border-line p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
        <h3 className="text-sm font-semibold text-ink-soft">{label}</h3>
        {annualTotal > 0 && (
          <span className="text-xs text-muted tabular-nums">
            {labelAnnualTotal} {currencySymbol}{fmtNum(annualTotal)}
            {dividendYieldPct > 0 && <> · {labelDividendYield} {dividendYieldPct.toFixed(2)}%</>}
          </span>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 480 }} role="img" aria-label={label}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* 그리드라인 + y축 눈금 */}
          {ticks.map((t) => {
            const y = padTop + plotH - (t / scaleMax) * plotH;
            return (
              <g key={t}>
                <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="var(--color-line)" strokeWidth={1} />
                <text x={padLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--color-muted)">
                  {compactNum(t)}
                </text>
              </g>
            );
          })}

          {/* 막대 */}
          {bars.map((b, i) => {
            const barH = scaleMax > 0 ? (b.amount / scaleMax) * plotH : 0;
            const x = padLeft + i * barSlot + (barSlot - barWidth) / 2;
            const y = padTop + plotH - barH;
            return (
              <g key={i}>
                {b.amount > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={(barH > 0 ? y : padTop + plotH) - 6}
                    textAnchor="middle"
                    fontSize={9.5}
                    fontWeight={hover === i ? 700 : 500}
                    fill={hover === i ? "var(--color-ink)" : "var(--color-ink-soft)"}
                    className="tabular-nums pointer-events-none transition-colors duration-150"
                  >
                    {compactNum(b.amount)}
                  </text>
                )}
                <rect
                  x={x}
                  y={barH > 0 ? y : padTop + plotH - 1}
                  width={barWidth}
                  height={Math.max(barH, 1)}
                  rx={4}
                  fill={`url(#${gradientId})`}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  className="transition-opacity duration-150 cursor-pointer"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                />
                <text x={x + barWidth / 2} y={height - padBottom + 16} textAnchor="middle" fontSize={10} fill="var(--color-muted)">
                  {monthLabels[i]}
                </text>
              </g>
            );
          })}

          {/* 기준선 */}
          <line x1={padLeft} x2={width - padRight} y1={padTop + plotH} y2={padTop + plotH} stroke="var(--color-line)" strokeWidth={1} />
        </svg>
      </div>

      {hover !== null && (
        <div className="mt-2 text-xs text-ink-soft">
          <span className="font-semibold text-ink">{monthLabels[hover]}</span>{" "}
          <span className="tabular-nums">{currencySymbol}{fmtNum(bars[hover].amount)}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardCharts({
  assetSlices,
  monthlyBars,
  totalValue,
  currencySymbol,
  fmtNum,
  labelAllocation,
  labelMonthlyDividends,
  labelTotal,
  labelAnnualTotal,
  labelDividendYield,
  dividendYieldPct,
}: Props) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <AllocationDonut
        slices={assetSlices}
        totalValue={totalValue}
        currencySymbol={currencySymbol}
        fmtNum={fmtNum}
        labelAllocation={labelAllocation}
        labelTotal={labelTotal}
      />
      <MonthlyDividendBars
        bars={monthlyBars}
        currencySymbol={currencySymbol}
        fmtNum={fmtNum}
        label={labelMonthlyDividends}
        labelAnnualTotal={labelAnnualTotal}
        labelDividendYield={labelDividendYield}
        dividendYieldPct={dividendYieldPct}
      />
    </div>
  );
}
