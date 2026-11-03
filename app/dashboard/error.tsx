"use client"; // 에러 바운더리는 클라이언트 컴포넌트여야 한다.

import { useEffect } from "react";

export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        <p>뉴스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-red-300 px-3.5 py-2 text-sm font-medium transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:min-h-0 dark:border-red-800 dark:hover:bg-red-900"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
