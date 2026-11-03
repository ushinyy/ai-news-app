import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";

export type CategoryFilter =
  | { type: "all" }
  | { type: "none" }
  | { type: "category"; id: number };

export type DashboardArticle = {
  id: number;
  sourceName: string;
  url: string;
  titleKo: string;
  summaryKo: string;
  publishedAt: Date | null;
  createdAt: Date;
  notionPageId: string | null;
  categoryId: number | null;
  categoryName: string | null;
};

export type DashboardCategory = {
  id: number;
  name: string;
  count: number;
};

const ARTICLE_LIMIT = 100;

// ?category=<id|none> 값을 필터로 바꾼다. 알 수 없는 값은 전체 보기로 처리한다.
export function parseCategoryFilter(
  value: string | string[] | undefined,
): CategoryFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "none") return { type: "none" };
  if (raw && /^\d+$/.test(raw)) return { type: "category", id: Number(raw) };
  return { type: "all" };
}

// 호출하는 쪽에서 Clerk userId를 확인한 뒤에만 부를 것. 모든 쿼리는 userId로 한정한다.
export async function getDashboardData(userId: string, filter: CategoryFilter) {
  const conditions: SQL[] = [eq(articles.userId, userId)];
  if (filter.type === "none") conditions.push(isNull(articles.categoryId));
  if (filter.type === "category")
    conditions.push(eq(articles.categoryId, filter.id));

  const [categoryRows, totals, articleRows] = await Promise.all([
    db
      .select({
        id: categories.id,
        name: categories.name,
        count: count(articles.id),
      })
      .from(categories)
      .leftJoin(articles, eq(articles.categoryId, categories.id))
      .where(eq(categories.userId, userId))
      .groupBy(categories.id, categories.name)
      .orderBy(categories.name),
    db
      .select({ total: count(), categorized: count(articles.categoryId) })
      .from(articles)
      .where(eq(articles.userId, userId)),
    db
      .select({
        id: articles.id,
        sourceName: articles.sourceName,
        url: articles.url,
        titleKo: articles.titleKo,
        summaryKo: articles.summaryKo,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        notionPageId: articles.notionPageId,
        categoryId: articles.categoryId,
        categoryName: categories.name,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(...conditions))
      // 발행일 최신순. 발행일이 없는 기사는 뒤로 보내고, 같으면 수집 시각 순.
      .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.createdAt))
      .limit(ARTICLE_LIMIT),
  ]);

  const { total, categorized } = totals[0];

  return {
    categories: categoryRows satisfies DashboardCategory[],
    total,
    uncategorized: total - categorized,
    articles: articleRows satisfies DashboardArticle[],
  };
}
