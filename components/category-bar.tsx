import type { CategoryFilter, DashboardCategory } from "@/lib/dashboard";
import { CategoryChip } from "@/components/category-chip";

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
      <CategoryChip
        href="/dashboard"
        active={filter.type === "all"}
        label="전체"
        count={total}
      />
      {uncategorized > 0 && (
        <CategoryChip
          href="/dashboard?category=none"
          active={filter.type === "none"}
          label="미분류"
          count={uncategorized}
        />
      )}
      {categories.map((category) => (
        <CategoryChip
          key={category.id}
          href={`/dashboard?category=${category.id}`}
          active={filter.type === "category" && filter.id === category.id}
          label={category.name}
          count={category.count}
        />
      ))}
      {/* 카테고리 추가 API가 아직 없어 비활성 상태로 둔다. */}
      <button
        type="button"
        disabled
        title="준비 중입니다"
        className="inline-flex min-h-10 items-center rounded-full border border-dashed border-zinc-300 px-3.5 py-1.5 text-sm text-zinc-500 transition hover:border-indigo-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-zinc-300 disabled:hover:text-zinc-500 sm:min-h-0 dark:border-zinc-700 dark:disabled:hover:border-zinc-700 dark:disabled:hover:text-zinc-500"
      >
        + 카테고리
      </button>
    </nav>
  );
}
