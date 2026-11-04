import type { CategoryFilter, DashboardCategory } from "@/lib/dashboard";
import { CategoryChips } from "@/components/category-chips";

export function CategoryBar({
  categories,
  total,
  uncategorized,
  filter,
}: {
  categories: DashboardCategory[];
  total: number;
  uncategorized: number;
  filter: CategoryFilter;
}) {
  return (
    <nav aria-label="카테고리" className="flex flex-wrap items-center gap-2 py-6">
      <CategoryChips
        categories={categories}
        total={total}
        uncategorized={uncategorized}
        filter={filter}
      />
    </nav>
  );
}
