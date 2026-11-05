import { and, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
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

export const PAGE_SIZE = 9;
export const MAX_QUERY_LENGTH = 100;

// ?q=<검색어> 값을 공백을 정리한 문자열로 바꾼다. 비어 있으면 빈 문자열.
export function parseQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

// 검색어를 공백으로 나눈 단어마다, 한글 제목·원문 제목·한글 요약 중 하나에 들어 있어야 한다(대소문자 무시).
function searchCondition(q: string): SQL | undefined {
  const terms = q.split(" ").filter(Boolean);
  return and(
    ...terms.map((term) => {
      // LIKE 와일드카드(% _ \)가 검색어에 있으면 글자 그대로 찾는다.
      const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
      return or(
        ilike(articles.titleKo, pattern),
        ilike(articles.titleOriginal, pattern),
        ilike(articles.summaryKo, pattern),
      );
    }),
  );
}

// ?category=<id|none> 값을 필터로 바꾼다. 알 수 없는 값은 전체 보기로 처리한다.
export function parseCategoryFilter(
  value: string | string[] | undefined,
): CategoryFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "none") return { type: "none" };
  if (raw && /^\d+$/.test(raw)) return { type: "category", id: Number(raw) };
  return { type: "all" };
}

// ?page=<n> 값을 1 이상의 정수로 바꾼다. 잘못된 값은 1페이지로 처리한다.
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && /^\d+$/.test(raw)) return Math.max(1, Number(raw));
  return 1;
}

// 호출하는 쪽에서 Clerk userId를 확인한 뒤에만 부를 것. 모든 쿼리는 userId로 한정한다.
export async function getDashboardData(
  userId: string,
  requestedFilter: CategoryFilter,
  requestedPage: number,
  q = "",
) {
  const filterConditions = (filter: CategoryFilter) => {
    const conditions: SQL[] = [eq(articles.userId, userId)];
    if (filter.type === "none") conditions.push(isNull(articles.categoryId));
    if (filter.type === "category")
      conditions.push(eq(articles.categoryId, filter.id));
    const search = q ? searchCondition(q) : undefined;
    if (search) conditions.push(search);
    return conditions;
  };

  const fetchArticles = (filter: CategoryFilter, page: number) => {
    const conditions = filterConditions(filter);

    return db
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
      .orderBy(
        sql`${articles.publishedAt} desc nulls last`,
        desc(articles.createdAt),
        // 페이지를 넘길 때 순서가 흔들리지 않도록 마지막 기준으로 id를 둔다.
        desc(articles.id),
      )
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);
  };

  const [categoryRows, totals] = await Promise.all([
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
  ]);

  const { total, categorized } = totals[0];

  // 삭제됐거나 없는 카테고리 ID로 들어오면 전체 보기로 처리한다.
  const unknownCategory =
    requestedFilter.type === "category" &&
    !categoryRows.some((c) => c.id === requestedFilter.id);
  const filter: CategoryFilter = unknownCategory
    ? { type: "all" }
    : requestedFilter;

  // 선택한 필터(와 검색어)에 해당하는 기사 수로 전체 페이지 수를 구한다.
  // 카테고리 칩의 개수는 검색과 무관한 전체 개수라, 검색 중에는 따로 센다.
  const filteredTotal = q
    ? (
        await db
          .select({ n: count() })
          .from(articles)
          .where(and(...filterConditions(filter)))
      )[0].n
    : filter.type === "all"
      ? total
      : filter.type === "none"
        ? total - categorized
        : (categoryRows.find((c) => c.id === filter.id)?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  // 범위를 넘어선 페이지(기사 삭제 등)는 마지막 페이지로 맞춘다.
  const page = Math.min(requestedPage, totalPages);

  const articleRows = await fetchArticles(filter, page);

  return {
    filter,
    q,
    categories: categoryRows satisfies DashboardCategory[],
    total,
    uncategorized: total - categorized,
    articles: articleRows satisfies DashboardArticle[],
    page,
    totalPages,
    filteredTotal,
  };
}
