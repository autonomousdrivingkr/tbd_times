import type { Metadata } from "next";
import { getRestaurants, type Place } from "@/lib/naver-local";
import { updatedAtLabel } from "@/lib/format";
import RestaurantCard from "@/components/RestaurantCard";

// 맛집 정보는 뉴스처럼 자주 바뀌지 않으므로 하루 단위로 재생성한다.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "맛집",
  description: "네이버 지역정보를 바탕으로 전국 주요 지역의 맛집을 모아 소개합니다.",
};

export default async function FoodPage() {
  const places = await getRestaurants();

  const grouped = new Map<string, Place[]>();
  for (const p of places) {
    const list = grouped.get(p.region) ?? [];
    list.push(p);
    grouped.set(p.region, list);
  }

  return (
    <div className="container-page py-8">
      <header className="mb-8 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span
            className="h-7 w-1.5 rounded-full"
            style={{ background: "var(--color-crypto)" }}
          />
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">맛집</h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          전국 지역별 맛집 · 마지막 업데이트 {updatedAtLabel()}
        </p>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-soft">
          Tibedra 맛집 섹션은 네이버 지역정보를 바탕으로 서울 주요 상권부터 부산·제주·전주 등
          지방 도시까지 지역별 맛집을 모아 소개합니다. 상호명·주소·연락처 등 장소 정보는 네이버가
          제공하며, 방문 전 영업시간과 최신 리뷰는 링크된 네이버 지도에서 다시 한번 확인하시길
          권합니다.
        </p>
      </header>

      {grouped.size === 0 ? (
        <p className="py-20 text-center text-muted">
          맛집 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : (
        <div className="space-y-12">
          {Array.from(grouped.entries()).map(([region, list]) => (
            <section key={region}>
              <h2 className="mb-4 font-serif text-xl font-bold">{region}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p) => (
                  <RestaurantCard key={p.id} place={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-10 border-t border-line pt-4 text-xs text-muted">
        장소 정보 제공: 네이버 지역정보. 정보 제공 시점과 실제 영업 상태가 다를 수 있습니다.
      </p>
    </div>
  );
}
