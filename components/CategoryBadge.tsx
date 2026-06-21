import { CATEGORY_LABELS, type Category } from "@/lib/sources";

const STYLES: Record<Category, string> = {
  ai: "bg-ai-soft text-ai",
  investment: "bg-invest-soft text-invest",
  crypto: "bg-crypto-soft text-crypto",
};

export default function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STYLES[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
