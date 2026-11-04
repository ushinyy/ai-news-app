"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { callCategoryApi } from "@/components/category-api";
import { CategoryNameInput } from "@/components/category-name-input";

export function AddCategory() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function create(name: string) {
    const result = await callCategoryApi("/api/categories", "POST", { name });
    if (!result.ok) return result.error;
    setEditing(false);
    router.refresh();
    return null;
  }

  if (editing) {
    return (
      <CategoryNameInput
        label="새 카테고리 이름"
        placeholder="새 카테고리 이름"
        onSubmit={create}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex min-h-10 items-center rounded-full border border-dashed border-zinc-300 px-3.5 py-1.5 text-sm text-zinc-500 transition hover:border-indigo-500 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:min-h-0 dark:border-zinc-700 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
    >
      + 카테고리
    </button>
  );
}
