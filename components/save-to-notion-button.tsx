"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed sm:min-h-0";

export function SaveToNotionButton({
  articleId,
  saved,
}: {
  articleId: number;
  saved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (saved || done) {
    return (
      <button
        type="button"
        disabled
        className={`${buttonBase} bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400`}
      >
        저장됨
      </button>
    );
  }

  const busy = loading || refreshing;

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/articles/${articleId}/notion`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "저장하지 못했어요.");
        return;
      }
      setDone(true);
      startRefresh(() => router.refresh());
    } catch {
      setError("네트워크 오류로 저장하지 못했어요.");
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
        className={`${buttonBase} bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25`}
      >
        {busy ? "저장 중…" : "저장하기"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </>
  );
}
