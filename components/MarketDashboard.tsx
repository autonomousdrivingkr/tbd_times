import {
  getMarketSnapshot,
  GROUP_LABELS,
  type MarketGroup,
  type Quote,
} from "@/lib/markets";
import { timeLabel } from "@/lib/format";

// 등락 색상 — 한국 시장 관례(상승=빨강, 하락=파랑). 라이트/다크 모두 판독 가능한 값.
const COLORS = {
  up: "#e5484d",
  down: "#3e7bfa",
  flat: "var(--color-muted)",
} as const;

const ARROWS = { up: "▲", down: "▼", flat: "―" } as const;
const SIGNS = { up: "+", down: "−", flat: "" } as const;

function QuoteTile({ q }: { q: Quote }) {
  const color = COLORS[q.direction];
  return (
    <div className="rounded-md border border-line bg-paper px-3.5 py-3">
      <p className="truncate text-xs text-muted">{q.label}</p>
      <p className="mt-1 font-serif text-lg font-bold tabular-nums leading-tight">
        {q.priceText}
      </p>
      <p
        className="mt-0.5 flex items-baseline gap-1.5 text-[13px] font-semibold tabular-nums"
        style={{ color }}
      >
        <span>
          {ARROWS[q.direction]} {SIGNS[q.direction]}
          {q.primaryChange}
        </span>
        {q.secondaryChange && (
          <span className="text-[11px] font-medium opacity-80">
            {SIGNS[q.direction]}
            {q.secondaryChange}
          </span>
        )}
      </p>
    </div>
  );
}

const GROUP_ORDER: MarketGroup[] = ["us", "kr", "macro"];

export default async function MarketDashboard() {
  const { quotes, fetchedAt } = await getMarketSnapshot();

  // 데이터가 하나도 없으면(외부 API 장애 등) 대시보드 자체를 렌더하지 않는다.
  if (quotes.length === 0) return null;

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: quotes.filter((q) => q.group === g),
  })).filter((s) => s.items.length > 0);

  return (
    <section className="mb-10 rounded-lg border border-line bg-paper-2 p-5 sm:p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-bold">📊 오늘의 시장</h2>
        <p className="text-xs text-muted">
          {timeLabel(fetchedAt)} 기준 · 전 거래일 종가 대비
        </p>
      </div>

      <div className="space-y-5">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
              {GROUP_LABELS[group]}
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((q) => (
                <QuoteTile key={q.symbol} q={q} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        지수·환율·원자재·금리 시세는 약 10분 간격으로 갱신되며, 정보 제공 목적일 뿐
        투자 권유가 아닙니다. 실제 체결가와 다를 수 있습니다.
      </p>
    </section>
  );
}
