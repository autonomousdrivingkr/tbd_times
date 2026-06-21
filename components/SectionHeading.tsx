import Link from "next/link";

export default function SectionHeading({
  title,
  subtitle,
  href,
  hrefLabel = "더보기",
  accent = "var(--color-accent)",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  accent?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
      <div className="flex items-center gap-3">
        <span className="h-5 w-1.5 rounded-full" style={{ background: accent }} />
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold leading-none">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-accent hover:underline whitespace-nowrap"
        >
          {hrefLabel} →
        </Link>
      )}
    </div>
  );
}
