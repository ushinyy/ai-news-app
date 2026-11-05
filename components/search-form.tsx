"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { dashboardHref } from "@/lib/dashboard-url";

// 키워드 검색창. `검색` 버튼이나 Enter로 제출하면 ?q=를 바꿔 이동한다.
// 카테고리 필터는 유지하고, 검색 조건이 바뀌므로 page는 1로 돌아간다.
export function SearchForm({
  query,
  category,
}: {
  /** 현재 적용된 검색어 */
  query: string;
  /** 유지할 카테고리 필터 값("none" 또는 카테고리 id) */
  category?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [lastQuery, setLastQuery] = useState(query);
  const [pending, startTransition] = useTransition();

  // 칩·페이지 이동 등으로 URL의 검색어가 바뀌면 입력창도 맞춘다.
  if (query !== lastQuery) {
    setLastQuery(query);
    setValue(query);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = value.replace(/\s+/g, " ").trim();
    setValue(q);
    startTransition(() => router.push(dashboardHref({ category, q })));
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      data-pending={pending}
      className="flex gap-2 pt-6"
    >
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={100}
        placeholder="뉴스 제목·요약에서 검색"
        aria-label="뉴스 검색어"
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:min-h-0 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {pending ? "검색 중…" : "검색"}
      </button>
    </form>
  );
}
