import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { createNotionPage } from "@/lib/notion";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) {
    return Response.json({ error: "기사를 찾을 수 없어요." }, { status: 404 });
  }
  const id = Number(rawId);

  const [article] = await db
    .select({
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      url: articles.url,
      sourceName: articles.sourceName,
      publishedAt: articles.publishedAt,
      notionPageId: articles.notionPageId,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.id, id), eq(articles.userId, userId)));

  if (!article) {
    return Response.json({ error: "기사를 찾을 수 없어요." }, { status: 404 });
  }
  // 이미 저장된 기사는 다시 만들지 않는다.
  if (article.notionPageId) {
    return Response.json({ notionPageId: article.notionPageId });
  }

  try {
    const notionPageId = await createNotionPage(article);
    await db
      .update(articles)
      .set({ notionPageId })
      .where(
        and(
          eq(articles.id, id),
          eq(articles.userId, userId),
          isNull(articles.notionPageId),
        ),
      );
    return Response.json({ notionPageId });
  } catch (error) {
    console.error("Notion 저장 실패", error);
    return Response.json(
      { error: "Notion에 저장하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
