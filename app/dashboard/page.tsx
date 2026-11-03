// 로그아웃 상태에서는 layout이 children을 렌더링하지 않아 instant 검증 대상에서 빠진다.
export const instant = false;

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { CategoryBar } from "@/components/category-bar";
import { NewsCard } from "@/components/news-card";
import { getDashboardData, parseCategoryFilter } from "@/lib/dashboard";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
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
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { userId } = await auth();
  if (!userId) return null; // 로그인 모달은 layout이 처리한다.

  const filter = parseCategoryFilter((await searchParams).category);
  const data = await getDashboardData(userId, filter);

  return (
    <>
      <CategoryBar
        categories={data.categories}
        total={data.total}
        uncategorized={data.uncategorized}
        filter={filter}
      />
      {data.articles.length === 0 ? (
        <p className="py-20 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {data.total === 0
            ? "아직 뉴스가 없어요. ‘뉴스 가져오기’로 첫 뉴스를 가져와 보세요."
            : "이 카테고리에는 뉴스가 없어요."}
        </p>
      ) : (
        <ul className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
          {data.articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </ul>
      )}
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="불러오는 중">
      <div className="flex gap-2 py-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-9 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
      <div className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    </div>
  );
}
