import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { fetchRecentArticles } from "@/lib/rss";

// 호출하는 쪽에서 Clerk userId를 확인한 뒤에만 부를 것.
export async function collectNews(userId: string) {
  const { articles: fetched, failedFeeds } = await fetchRecentArticles(24);
  if (fetched.length === 0) return { added: 0, failedFeeds };

  // DB에 이미 있는 URL은 걸러낸다 (나중에 Claude 호출 전 필터로도 쓰인다).
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
  const fresh = fetched.filter((a) => !known.has(a.url));
  if (fresh.length === 0) return { added: 0, failedFeeds };

  // 번역·분류 전이라 title_ko / summary_ko는 원문으로 임시 채운다. categoryId는 null(미분류).
  const inserted = await db
    .insert(articles)
    .values(
      fresh.map((a) => ({
        userId,
        sourceName: a.sourceName,
        url: a.url,
        titleOriginal: a.titleOriginal,
        titleKo: a.titleOriginal,
        summaryKo: a.summary || a.titleOriginal,
        publishedAt: a.publishedAt,
      })),
    )
    .onConflictDoNothing({ target: [articles.userId, articles.url] })
    .returning({ id: articles.id });

  return { added: inserted.length, failedFeeds };
}
