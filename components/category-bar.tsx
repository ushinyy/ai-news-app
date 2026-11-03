import Link from "next/link";
import type { CategoryFilter, DashboardCategory } from "@/lib/dashboard";

const chipBase =
  "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const chipIdle =
  "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";
const chipActive =
  "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400";

function Chip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`${chipBase} ${active ? chipActive : chipIdle}`}
    >
      {label}
      <span className="ml-1.5 text-xs opacity-60">{count}</span>
    </Link>
  );
}

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
      <Chip
        href="/dashboard"
        active={filter.type === "all"}
        label="전체"
        count={total}
      />
      {uncategorized > 0 && (
        <Chip
          href="/dashboard?category=none"
          active={filter.type === "none"}
          label="미분류"
          count={uncategorized}
        />
      )}
      {categories.map((category) => (
        <Chip
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
        className="inline-flex items-center rounded-full border border-dashed border-zinc-300 px-3.5 py-1.5 text-sm text-zinc-500 transition hover:border-indigo-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-zinc-300 disabled:hover:text-zinc-500 dark:border-zinc-700 dark:disabled:hover:border-zinc-700 dark:disabled:hover:text-zinc-500"
      >
        + 카테고리
      </button>
    </nav>
  );
}
