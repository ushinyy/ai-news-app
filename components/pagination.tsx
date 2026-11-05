"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { dashboardHref } from "@/lib/dashboard-url";

const base =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:min-h-9 sm:min-w-9";
const idle =
  "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";
const current =
  "border-indigo-600 bg-indigo-600 font-medium text-white dark:border-indigo-500 dark:bg-indigo-500";
const disabled =
  "cursor-not-allowed border-zinc-200 text-zinc-400 opacity-60 dark:border-zinc-800 dark:text-zinc-500";

// 이동 중에는 data-pending을 심어 대시보드가 목록을 흐리게 하도록 한다(카테고리 칩과 같은 방식).
function Pending({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return <span data-pending={pending}>{children}</span>;
}

// 1 … 48 49 [50] 51 52 … 100 형태: 첫·끝 페이지와 현재 페이지 앞뒤 2개씩을 보여 주고,
// 번호가 이어지지 않는 자리에만 …을 넣는다.
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages]);
  for (let p = page - 2; p <= page + 2; p++) pages.add(p);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("gap");
    items.push(p);
  });
  return items;
}

// 이동할 수 없으면 링크 대신 비활성 표시를 그린다.
function NavButton({
  enabled,
  href,
  label,
  children,
}: {
  enabled: boolean;
  href: string;
  label: string;
  children: ReactNode;
}) {
  if (!enabled) {
    return (
      <span aria-disabled="true" className={`${base} ${disabled}`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={`${base} ${idle}`}>
      <Pending>{children}</Pending>
    </Link>
  );
}

export function Pagination({
  page,
  totalPages,
  category,
  q,
}: {
  page: number;
  totalPages: number;
  /** 유지할 카테고리 필터 값("none" 또는 카테고리 id). 전체 보기면 생략한다. */
  category?: string;
  /** 유지할 검색어 */
  q?: string;
}) {
  if (totalPages <= 1) return null;

  // 카테고리 필터를 유지한 채 페이지만 바꾼다. 1페이지는 page 파라미터를 생략한다.
  // (서버 컴포넌트에서 함수를 넘길 수 없어 href는 여기서 만든다.)
  const hrefFor = (target: number) =>
    dashboardHref({ category, q, page: target });

  return (
    <nav
      aria-label="페이지"
      className="flex flex-wrap items-center justify-center gap-1.5 pb-12 pt-8"
    >
      <NavButton
        enabled={page > 1}
        href={hrefFor(1)}
        label="처음 페이지"
      >
        처음
      </NavButton>
      <NavButton
        enabled={page > 1}
        href={hrefFor(page - 1)}
        label="이전 페이지"
      >
        이전
      </NavButton>

      {pageItems(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="px-1 text-sm text-zinc-500 dark:text-zinc-400"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-label={`${item}페이지`}
            aria-current={item === page ? "page" : undefined}
            className={`${base} ${item === page ? current : idle}`}
          >
            <Pending>{item}</Pending>
          </Link>
        ),
      )}

      <NavButton
        enabled={page < totalPages}
        href={hrefFor(page + 1)}
        label="다음 페이지"
      >
        다음
      </NavButton>
      <NavButton
        enabled={page < totalPages}
        href={hrefFor(totalPages)}
        label="마지막 페이지"
      >
        끝
      </NavButton>
    </nav>
  );
}
