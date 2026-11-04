"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "empty"; failed: string[] }
  | { kind: "added"; count: number; failed: string[] }
  | { kind: "error"; message: string };

export function FetchNewsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = loading || refreshing;

  async function onClick() {
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/fetch-news", { method: "POST" });
      const body = (await res.json().catch(() => null)) as {
        added?: number;
        failedFeeds?: string[];
        error?: string;
      } | null;
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: body?.error ?? "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }
      const added = body?.added ?? 0;
      const failed = body?.failedFeeds ?? [];
      setStatus(
        added > 0
          ? { kind: "added", count: added, failed }
          : { kind: "empty", failed },
      );
      if (added > 0) startRefresh(() => router.refresh());
    } catch {
      setStatus({
        kind: "error",
        message: "네트워크 오류로 뉴스를 가져오지 못했어요.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <p
        role="status"
        className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400"
      >
        {status.kind === "empty" && "새 뉴스 없음"}
        {status.kind === "added" && `새 뉴스 ${status.count}건`}
        {(status.kind === "empty" || status.kind === "added") &&
          status.failed.length > 0 &&
          ` (${status.failed.join(", ")} 불러오기 실패)`}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {busy && (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            className="size-4 animate-spin"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
        {busy ? "가져오는 중…" : "뉴스 가져오기"}
      </button>
      {status.kind === "error" && (
        <div
          role="alert"
          className="fixed inset-x-4 top-16 z-20 mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
