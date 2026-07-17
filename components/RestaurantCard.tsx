import type { Place } from "@/lib/naver-local";

export default function RestaurantCard({
  place,
  accent = "var(--color-crypto)",
  accentSoft = "var(--color-crypto-soft)",
}: {
  place: Place;
  accent?: string;
  accentSoft?: string;
}) {
  return (
    <article className="rounded-lg border border-line bg-paper-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-lg font-bold leading-snug">{place.name}</h3>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: accentSoft, color: accent }}
        >
          {place.category}
        </span>
      </div>
      <p className="mt-1 text-xs font-medium text-muted">{place.region}</p>
      {(place.reason || place.description) && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft line-clamp-2">
          {place.reason || place.description}
        </p>
      )}
      <div className="mt-3 space-y-1 text-xs text-muted">
        {(place.roadAddress || place.address) && (
          <p className="line-clamp-1">📍 {place.roadAddress || place.address}</p>
        )}
        {place.telephone && <p>📞 {place.telephone}</p>}
      </div>
      <a
        href={place.mapUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-3 inline-block text-sm font-semibold text-accent hover:underline"
      >
        네이버 지도에서 보기 ↗
      </a>
    </article>
  );
}
