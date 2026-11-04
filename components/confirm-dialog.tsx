"use client";

import { useEffect, useRef } from "react";

// 삭제·병합처럼 되돌리기 어려운 동작 전에 띄우는 확인창(네이티브 <dialog>).
// 열려 있을 때만 렌더링하는 방식이다. 마운트되면 열리고, 언마운트되면 닫힌다.
// 포커스는 안전한 쪽인 `취소` 버튼에서 시작한다. Esc·바깥 클릭은 취소로 처리한다(요청 중에는 무시).
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pending,
  error,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  error: string | null;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={(e) => {
        // Esc: 브라우저 기본 닫기 대신 부모가 상태로 닫는다.
        e.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="p-5 sm:p-6">
        <h2 id="confirm-dialog-title" className="text-base font-semibold">
          {title}
        </h2>
        <p
          id="confirm-dialog-description"
          className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
        >
          {description}
        </p>
        {children}
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            disabled={pending}
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending || confirmDisabled}
            onClick={onConfirm}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 dark:bg-red-500 dark:hover:bg-red-400"
          >
            {pending ? "처리 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
