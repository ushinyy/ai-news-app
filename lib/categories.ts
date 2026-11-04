import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
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
