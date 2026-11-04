import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import {
  categoryKey,
  normalizeCategoryName,
  validateCategoryName,
} from "@/lib/category-name";

export type CategoryErrorCode = "invalid" | "duplicate" | "not_found";

export type CategoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: CategoryErrorCode; message: string };

export const CATEGORY_ERROR_STATUS: Record<CategoryErrorCode, number> = {
  invalid: 400,
  duplicate: 409,
  not_found: 404,
};

const DUPLICATE: CategoryResult<never> = {
  ok: false,
  code: "duplicate",
  message: "이미 같은 이름의 카테고리가 있어요.",
};

// 동시 요청으로 DB의 (user_id, name) unique 제약에 걸린 경우를 알아본다.
function isUniqueViolation(error: unknown) {
  const code =
    (error as { code?: string })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

// 이 모듈의 함수는 모두 호출하는 쪽에서 Clerk userId를 확인한 뒤에만 부를 것.
// 모든 쿼리는 userId로 한정해 다른 사용자의 카테고리는 건드리지 않는다.

export async function createCategory(
  userId: string,
  rawName: string,
): Promise<CategoryResult<{ id: number; name: string }>> {
  const message = validateCategoryName(rawName);
  if (message) return { ok: false, code: "invalid", message };
  const name = normalizeCategoryName(rawName);

  const existing = await db
    .select({ name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId));
  if (existing.some((c) => categoryKey(c.name) === categoryKey(name))) {
    return DUPLICATE;
  }

  try {
    const [created] = await db
      .insert(categories)
      .values({ userId, name })
      .returning({ id: categories.id, name: categories.name });
    return { ok: true, value: created };
  } catch (error) {
    if (isUniqueViolation(error)) return DUPLICATE;
    throw error;
  }
}

export async function renameCategory(
  userId: string,
  id: number,
  rawName: string,
): Promise<CategoryResult<{ id: number; name: string }>> {
  const message = validateCategoryName(rawName);
  if (message) return { ok: false, code: "invalid", message };
  const name = normalizeCategoryName(rawName);

  const mine = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId));
  const current = mine.find((c) => c.id === id);
  if (!current) {
    return { ok: false, code: "not_found", message: "카테고리를 찾을 수 없어요." };
  }
  // 자기 자신은 제외하고 비교하므로 "llm" → "LLM"처럼 대소문자만 바꾸는 것은 허용된다.
  if (mine.some((c) => c.id !== id && categoryKey(c.name) === categoryKey(name))) {
    return DUPLICATE;
  }
  if (current.name === name) return { ok: true, value: current };

  try {
    const [updated] = await db
      .update(categories)
      .set({ name })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id, name: categories.name });
    if (!updated) {
      return { ok: false, code: "not_found", message: "카테고리를 찾을 수 없어요." };
    }
    return { ok: true, value: updated };
  } catch (error) {
    if (isUniqueViolation(error)) return DUPLICATE;
    throw error;
  }
}

// 카테고리를 지운다. 이 카테고리의 기사는 FK(onDelete: set null)에 따라 미분류로 옮겨진다.
// 이동될 기사 수 조회와 삭제를 한 번의 batch(단일 트랜잭션)로 실행해 건수가 실제와 어긋나지 않게 한다.
export async function deleteCategory(
  userId: string,
  id: number,
): Promise<CategoryResult<{ unassigned: number }>> {
  const [countRows, deleted] = await db.batch([
    db
      .select({ n: count() })
      .from(articles)
      .where(and(eq(articles.userId, userId), eq(articles.categoryId, id))),
    db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id }),
  ]);
  if (deleted.length === 0) {
    return { ok: false, code: "not_found", message: "카테고리를 찾을 수 없어요." };
  }
  return { ok: true, value: { unassigned: countRows[0].n } };
}

function isForeignKeyViolation(error: unknown) {
  const code =
    (error as { code?: string })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23503";
}

// sourceId의 기사를 모두 targetId로 옮기고 sourceId 카테고리를 지운다.
// 기사 이동과 카테고리 삭제는 한 번의 batch(단일 트랜잭션)로 실행해, 중간에 실패하면 둘 다 취소된다.
export async function mergeCategories(
  userId: string,
  sourceId: number,
  targetId: number,
): Promise<CategoryResult<{ moved: number; targetId: number }>> {
  if (sourceId === targetId) {
    return {
      ok: false,
      code: "invalid",
      message: "같은 카테고리로는 병합할 수 없어요.",
    };
  }
  const notFound = {
    ok: false,
    code: "not_found",
    message: "카테고리를 찾을 수 없어요.",
  } as const;

  // 두 카테고리 모두 이 사용자의 것이어야 한다.
  const mine = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(eq(categories.userId, userId), inArray(categories.id, [sourceId, targetId])),
    );
  if (mine.length !== 2) return notFound;

  try {
    const [movedRows, deleted] = await db.batch([
      db
        .update(articles)
        .set({ categoryId: targetId })
        .where(and(eq(articles.userId, userId), eq(articles.categoryId, sourceId)))
        .returning({ id: articles.id }),
      db
        .delete(categories)
        .where(and(eq(categories.id, sourceId), eq(categories.userId, userId)))
        .returning({ id: categories.id }),
    ]);
    if (deleted.length === 0) return notFound;
    return { ok: true, value: { moved: movedRows.length, targetId } };
  } catch (error) {
    // 확인 직후 대상 카테고리가 지워졌다면 FK 위반이 나며 batch 전체가 취소된다.
    if (isForeignKeyViolation(error)) return notFound;
    throw error;
  }
}
