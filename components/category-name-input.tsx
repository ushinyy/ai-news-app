"use client";

import { useEffect, useId, useRef, useState } from "react";
import { validateCategoryName } from "@/lib/category-name";

// 칩 자리에서 이름을 입력받는 인라인 입력창. 추가와 이름 수정이 함께 쓴다.
// onSubmit은 실패 시 안내 문구를, 성공 시 null을 돌려준다(성공하면 부모가 이 컴포넌트를 닫는다).
export function CategoryNameInput({
  initialValue = "",
  label,
  placeholder,
  onSubmit,
  onCancel,
}: {
  initialValue?: string;
  label: string;
  placeholder?: string;
  onSubmit: (name: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function submit() {
    if (pending) return;
    const message = validateCategoryName(value);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setPending(true);
    const serverError = await onSubmit(value);
    if (serverError) {
      setError(serverError);
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col">
      <input
        ref={inputRef}
        type="text"
        value={value}
        readOnly={pending}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          // 한글 입력 중(조합 중)의 Enter는 글자 확정이므로 제출로 보지 않는다.
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        onBlur={() => {
          if (!pending) onCancel();
        }}
        className="min-h-10 w-44 rounded-full border border-indigo-500 bg-white px-3.5 py-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-indigo-500/40 read-only:opacity-60 sm:min-h-0 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 max-w-64 px-3.5 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
