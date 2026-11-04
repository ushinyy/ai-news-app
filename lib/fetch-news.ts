import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { enrichArticles } from "@/lib/claude";
import { fetchRecentArticles } from "@/lib/rss";

// 가져오기 1회당 Claude에 넘길 최대 기사 수(비용 상한). 넘친 기사는 다음 가져오기 때 이어서 처리된다.
const MAX_PER_FETCH = 30;
const BATCH_SIZE = 10;

// 호출하는 쪽에서 Clerk userId를 확인한 뒤에만 부를 것.
export async function collectNews(userId: string) {
  const { articles: fetched, failedFeeds } = await fetchRecentArticles(24);
  if (fetched.length === 0) {
    return { added: 0, failedFeeds, failedArticles: 0, remaining: 0 };
  }

  // DB에 이미 있는 URL은 Claude를 부르기 전에 걸러낸다.
  const existing = await db
    .select({ url: articles.url })
    .from(articles)
    .where(
      and(
        eq(articles.userId, userId),
        inArray(
          articles.url,
          fetched.map((a) => a.url),
        ),
      ),
    );
  const known = new Set(existing.map((row) => row.url));
  const fresh = fetched
    .filter((a) => !known.has(a.url))
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  if (fresh.length === 0) {
    return { added: 0, failedFeeds, failedArticles: 0, remaining: 0 };
  }

  const targets = fresh.slice(0, MAX_PER_FETCH);
  const remaining = fresh.length - targets.length;

  let added = 0;
  let failedArticles = 0;
  // 배치마다 새로 생긴 카테고리가 다음 배치에도 재사용되도록 순서대로 처리한다.
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    try {
      const existingCategories = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.userId, userId));

      const enriched = await enrichArticles(
        batch.map((a) => ({ title: a.titleOriginal, summary: a.summary })),
        existingCategories.map((c) => c.name),
      );

      const categoryIds = new Map(existingCategories.map((c) => [c.name, c.id]));
      const newNames = [
        ...new Set(
          enriched.map((e) => e.category).filter((name) => !categoryIds.has(name)),
        ),
      ];
      if (newNames.length > 0) {
        await db
          .insert(categories)
          .values(newNames.map((name) => ({ userId, name })))
          .onConflictDoNothing({ target: [categories.userId, categories.name] });
        const created = await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(
            and(eq(categories.userId, userId), inArray(categories.name, newNames)),
          );
        for (const c of created) categoryIds.set(c.name, c.id);
      }

      const inserted = await db
        .insert(articles)
        .values(
          batch.map((a, idx) => ({
            userId,
            sourceName: a.sourceName,
            url: a.url,
            titleOriginal: a.titleOriginal,
            titleKo: enriched[idx].titleKo,
            summaryKo: enriched[idx].summaryKo,
            categoryId: categoryIds.get(enriched[idx].category) ?? null,
            publishedAt: a.publishedAt,
          })),
        )
        .onConflictDoNothing({ target: [articles.userId, articles.url] })
        .returning({ id: articles.id });
      added += inserted.length;
    } catch (error) {
      // 실패한 배치는 저장하지 않는다. URL이 DB에 없으므로 다음 가져오기에서 다시 시도된다.
      console.error("Claude 처리 실패", error);
      failedArticles += batch.length;
    }
  }

  return { added, failedFeeds, failedArticles, remaining };
}
