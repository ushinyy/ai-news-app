"use client";

import { useState } from "react";
import { AddCategory } from "@/components/add-category";
import { CategoryChip } from "@/components/category-chip";
import { ManagedCategoryChip } from "@/components/managed-category-chip";
import type { CategoryFilter, DashboardCategory } from "@/lib/dashboard";

// 카테고리 칩 줄. 편집 모드 상태를 칩과 `편집/완료` 버튼이 함께 쓰므로 한 클라이언트 컴포넌트에 둔다.
// 편집 모드에서는 모든 칩이 필터 이동을 하지 않고, 카테고리 칩에만 ⋯ 메뉴가 나타난다.
export function CategoryChips({
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
  const [editRequested, setEditRequested] = useState(false);
  // 편집할 카테고리가 없어지면(예: 마지막 하나를 삭제) 자동으로 편집 모드를 벗어난다.
  const editing = editRequested && categories.length > 0;

  return (
    <>
      <CategoryChip
        href="/dashboard"
        active={filter.type === "all"}
        label="전체"
        count={total}
        navigable={!editing}
      />
      {uncategorized > 0 && (
        <CategoryChip
          href="/dashboard?category=none"
          active={filter.type === "none"}
          label="미분류"
          count={uncategorized}
          navigable={!editing}
        />
      )}
      {categories.map((category) => (
        <ManagedCategoryChip
          key={category.id}
          id={category.id}
          name={category.name}
          count={category.count}
          active={filter.type === "category" && filter.id === category.id}
          editing={editing}
        />
      ))}
      <AddCategory />
      {categories.length > 0 && (
        <button
          type="button"
          aria-pressed={editing}
          onClick={() => setEditRequested((value) => !value)}
          className={`inline-flex min-h-10 items-center rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:min-h-0 ${
            editing
              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
              : "text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
          }`}
        >
          {editing ? "완료" : "편집"}
        </button>
      )}
    </>
  );
}
