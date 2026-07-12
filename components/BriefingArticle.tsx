import Link from "next/link";
import type { DailyBriefing } from "@/lib/briefing";

/** 데일리 브리핑 칼럼 본문 (오늘/과거 날짜 페이지에서 공용으로 사용) */
export default function BriefingArticle({ briefing }: { briefing: DailyBriefing }) {
  return (
    <div className="mt-8 space-y-8 text-[16px] leading-relaxed">
      <p className="font-medium text-ink">{briefing.intro}</p>

      {briefing.sections.map((s, idx) => (
        <section key={s.title}>
          <h2 className="mb-2 font-serif text-xl font-bold">
            <span className="mr-2 text-accent">{idx + 1}.</span>
            {s.title}
          </h2>
          <p className="text-ink-soft">{s.body}</p>
          {s.items.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {s.items.map((ref) => (
                <li key={ref.path} className="text-sm">
                  <Link href={ref.path} className="text-accent hover:underline">
                    {ref.title}
                  </Link>
                  <span className="ml-1.5 text-xs text-muted">{ref.source}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="rounded-lg bg-accent-soft p-4 text-[15px] text-ink-soft">
        {briefing.closing}
      </p>
    </div>
  );
}
