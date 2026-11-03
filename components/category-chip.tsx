"use client";

import Link, { useLinkStatus } from "next/link";

const chipBase =
  "inline-flex min-h-10 items-center rounded-full border px-3.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:min-h-0";
const chipIdle =
  "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";
const chipActive =
  "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400";

// 이동 중에는 개수 자리에 스피너를 겹쳐 보여 준다(자리 크기는 그대로라 레이아웃이 흔들리지 않는다).
// data-pending은 목록 쪽에서 group-has로 읽어 목록을 흐리게 만드는 데 쓴다.
function Count({ count }: { count: number }) {
  const { pending } = useLinkStatus();
  return (
    <span data-pending={pending} className="relative ml-1.5 text-xs">
      <span className={pending ? "invisible" : "opacity-60"}>{count}</span>
      {pending && (
        <span
          aria-hidden
          className="absolute inset-0 m-auto size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
    </span>
  );
}

export function CategoryChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`${chipBase} ${active ? chipActive : chipIdle}`}
    >
      {label}
      <Count count={count} />
    </Link>
  );
}
