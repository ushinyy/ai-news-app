"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteArticleButton({ articleId }: { articleId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  // 삭제에 성공하면 목록이 새로 그려지기 전에도 카드가 바로 사라진다.
  if (removed) return null;

  const busy = loading || refreshing;

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      // 이미 없는 기사(404)도 화면에서는 치운다.
      if (!res.ok && res.status !== 404) {
        setError(body?.error ?? "삭제하지 못했어요.");
        return;
      }
      setRemoved(true);
      startRefresh(() => router.refresh());
    } catch {
      setError("네트워크 오류로 삭제하지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-label="기사 삭제"
        title="삭제"
        className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-red-400"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
      {error && (
        <p
          role="alert"
          className="absolute right-2 top-10 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </>
  );
}
