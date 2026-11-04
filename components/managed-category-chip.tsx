"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { callCategoryApi } from "@/components/category-api";
import { CategoryChip } from "@/components/category-chip";
import { CategoryNameInput } from "@/components/category-name-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { normalizeCategoryName } from "@/lib/category-name";

// 카테고리 칩. 편집 모드(editing)일 때만 오른쪽에 ⋯ 메뉴(이름 수정 등)가 붙고, 이때는 칩을 눌러도 이동하지 않는다.
// 서버 컴포넌트에서는 직렬화되는 값만 넘긴다.
export function ManagedCategoryChip({
  id,
  name,
  count,
  active,
  editing,
}: {
  id: number;
  name: string;
  count: number;
  active: boolean;
  editing: boolean;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [menuRequested, setMenuRequested] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // 편집 모드를 벗어나면(완료) 열려 있던 메뉴도 함께 닫힌다.
  const menuOpen = menuRequested && editing;

  // 메뉴가 열리면 첫 항목에 포커스를 두고, 바깥 클릭·Esc로 닫는다.
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setMenuRequested(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuRequested(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [],
    );
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? (index + 1) % items.length
        : (index - 1 + items.length) % items.length;
    items[next].focus();
  }

  async function rename(newName: string) {
    // 바뀐 게 없으면 요청 없이 닫는다.
    if (normalizeCategoryName(newName) === name) {
      setRenaming(false);
      return null;
    }
    const result = await callCategoryApi(`/api/categories/${id}`, "PATCH", {
      name: newName,
    });
    if (!result.ok) return result.error;
    setRenaming(false);
    router.refresh();
    return null;
  }

  function openDeleteDialog() {
    setMenuRequested(false);
    setDeleteError(null);
    setConfirmingDelete(true);
  }

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    const result = await callCategoryApi(`/api/categories/${id}`, "DELETE");
    // 이미 다른 곳에서 지워진 카테고리(404)는 원하는 결과와 같으므로 성공처럼 처리한다.
    if (!result.ok && result.status !== 404) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
    setConfirmingDelete(false);
    setDeleting(false);
    // 보고 있던 카테고리를 지웠다면 전체 보기로 돌아간다(page 파라미터도 함께 사라진다).
    if (active) router.push("/dashboard");
    router.refresh();
  }

  // 평소에는 이름 + 개수만 있는 원래 칩 모양이다.
  if (!editing) {
    return (
      <CategoryChip
        href={`/dashboard?category=${id}`}
        active={active}
        label={name}
        count={count}
      />
    );
  }

  if (renaming) {
    return (
      <CategoryNameInput
        initialValue={name}
        label={`‘${name}’ 카테고리 새 이름`}
        onSubmit={rename}
        onCancel={() => setRenaming(false)}
      />
    );
  }

  return (
    <span ref={wrapperRef} className="relative inline-flex items-center">
      <CategoryChip
        href={`/dashboard?category=${id}`}
        active={active}
        label={name}
        count={count}
        navigable={false}
        className="pr-9"
      />
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${name} 카테고리 메뉴`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuRequested((open) => !open)}
        className={`absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-base leading-none transition hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:hover:bg-white/15 ${
          active ? "text-white" : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        <span aria-hidden>⋯</span>
      </button>
      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`${name} 카테고리`}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full left-0 z-20 mt-1 min-w-36 rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-md dark:border-zinc-700 dark:bg-zinc-900"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuRequested(false);
              setRenaming(true);
            }}
            className="block min-h-10 w-full px-3.5 py-2 text-left text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none sm:min-h-0 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
          >
            이름 수정
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openDeleteDialog}
            className="block min-h-10 w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none sm:min-h-0 dark:text-red-400 dark:hover:bg-red-950 dark:focus-visible:bg-red-950"
          >
            삭제
          </button>
        </div>
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title={`‘${name}’ 카테고리를 삭제할까요?`}
          description={
            count > 0
              ? `이 카테고리의 기사 ${count}건은 삭제되지 않고 미분류로 이동해요.`
              : "이 카테고리에는 기사가 없어요."
          }
          confirmLabel="삭제"
          pending={deleting}
          error={deleteError}
          onConfirm={remove}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </span>
  );
}
