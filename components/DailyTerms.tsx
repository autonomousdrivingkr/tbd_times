import Link from "next/link";
import { GLOSSARY, GLOSSARY_GROUPS } from "@/lib/glossary";

/**
 * 오늘의 용어: 용어사전(자체 원본 콘텐츠)에서 분야별 1개씩 뽑아 홈에 노출한다.
 * KST 날짜 기준으로 매일 다른 용어가 순환된다.
 */
export default function DailyTerms() {
  const dayIndex = Math.floor((Date.now() + 9 * 3600 * 1000) / 86400000);
  const picks = GLOSSARY_GROUPS.map((g) => {
    const list = GLOSSARY[g.key] ?? [];
    return { group: g, term: list[dayIndex % Math.max(list.length, 1)] };
  }).filter((p) => p.term);

  if (picks.length === 0) return null;

  return (
    <section className="mb-14 rounded-lg border border-line bg-paper-2 p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-bold">📖 오늘의 용어</h2>
        <Link href="/glossary" className="text-sm font-medium text-accent hover:underline">
          용어사전 전체 보기 →
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {picks.map(({ group, term }) => (
          <Link
            key={term.term}
            href={`/glossary#${group.key}`}
            className="group block"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: group.accent }}>
              {group.label}
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="font-bold group-hover:text-accent">{term.term}</span>
              {term.en && <span className="text-xs text-muted">{term.en}</span>}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft line-clamp-3">{term.def}</p>
          </Link>
        ))}
      </div>
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        뉴스가 어렵게 느껴진다면{" "}
        <Link href="/glossary" className="text-accent hover:underline">
          용어사전
        </Link>
        과{" "}
        <Link href="/faq" className="text-accent hover:underline">
          자주 묻는 질문
        </Link>
        을 먼저 읽어보세요. Tibedra 편집팀이 직접 작성한 해설 콘텐츠입니다.
      </p>
    </section>
  );
}
