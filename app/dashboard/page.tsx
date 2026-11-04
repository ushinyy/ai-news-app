// 로그아웃 상태에서는 layout이 children을 렌더링하지 않아 instant 검증 대상에서 빠진다.
export const instant = false;

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { CategoryBar } from "@/components/category-bar";
import { EmptyState } from "@/components/empty-state";
import { NewsCard } from "@/components/news-card";
import { Pagination } from "@/components/pagination";
import {
  getDashboardData,
  PAGE_SIZE,
  parseCategoryFilter,
  parsePage,
} from "@/lib/dashboard";

type SearchParams = Promise<{
  category?: string | string[];
  page?: string | string[];
}>;

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Dashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { userId } = await auth();
  if (!userId) return null; // 로그인 모달은 layout이 처리한다.

  const params = await searchParams;
  const data = await getDashboardData(
    userId,
    parseCategoryFilter(params.category),
    parsePage(params.page),
  );

  const category =
    data.filter.type === "none"
      ? "none"
      : data.filter.type === "category"
        ? String(data.filter.id)
        : undefined;

  // 기사도 카테고리도 하나도 없으면 카테고리 바 없이 안내만 보여 준다.
  if (data.total === 0 && data.categories.length === 0) {
    return (
      <EmptyState
        title="아직 수집한 뉴스가 없어요"
        description="뉴스를 수집하면 이곳에 카드로 정리돼요."
      />
    );
  }

  return (
    // 칩을 눌러 이동하는 동안(data-pending) 목록을 흐리게 해 반응을 보여 준다.
    <div className="group/dash">
      <CategoryBar
        categories={data.categories}
        total={data.total}
        uncategorized={data.uncategorized}
        filter={data.filter}
      />
      <div className="transition-opacity delay-150 group-has-[[data-pending=true]]/dash:opacity-60">
        {data.articles.length === 0 ? (
          <EmptyState
            title="이 카테고리에는 뉴스가 없어요"
            description="다른 카테고리를 고르거나 전체 뉴스를 확인해 보세요."
            action={{ href: "/dashboard", label: "전체 보기" }}
          />
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </ul>
            <p className="pt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
              총 {data.filteredTotal}건
              {data.totalPages > 1 &&
                ` · ${data.page}/${data.totalPages} 페이지 (페이지당 ${PAGE_SIZE}건)`}
            </p>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              category={category}
            />
            {data.totalPages <= 1 && <div className="pb-12" />}
          </>
        )}
      </div>
    </div>
  );
}

// 실제 화면(카테고리 바 + 카드 구조)을 본뜬 로딩 화면
function DashboardSkeleton() {
  const bar = "animate-pulse rounded bg-zinc-200 dark:bg-zinc-800";
  return (
    <div role="status">
      <span className="sr-only">불러오는 중…</span>
      <div aria-hidden className="flex flex-wrap gap-2 py-6">
        {["w-20", "w-16", "w-24", "w-20", "w-28"].map((w, i) => (
          <div key={i} className={`h-10 rounded-full sm:h-[34px] ${w} ${bar}`} />
        ))}
      </div>
      <ul aria-hidden className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li
            key={i}
            className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className={`h-5 w-16 rounded-full ${bar}`} />
              <div className={`h-3 w-28 ${bar}`} />
            </div>
            <div className={`mt-4 h-4 w-11/12 ${bar}`} />
            <div className={`mt-2 h-4 w-3/5 ${bar}`} />
            <div className="mt-4 space-y-2">
              <div className={`h-3 w-full ${bar}`} />
              <div className={`h-3 w-full ${bar}`} />
              <div className={`h-3 w-2/3 ${bar}`} />
            </div>
            <div className="mt-5 flex gap-2">
              <div className={`h-11 w-20 rounded-lg sm:h-9 ${bar}`} />
              <div className={`h-11 w-20 rounded-lg sm:h-9 ${bar}`} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
