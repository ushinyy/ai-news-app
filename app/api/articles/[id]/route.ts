import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";

export async function DELETE(
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

  try {
    const deleted = await db
      .delete(articles)
      .where(and(eq(articles.id, Number(rawId)), eq(articles.userId, userId)))
      .returning({ id: articles.id });

    if (deleted.length === 0) {
      return Response.json(
        { error: "기사를 찾을 수 없어요." },
        { status: 404 },
      );
    }
    return Response.json({ id: deleted[0].id });
  } catch (error) {
    console.error("기사 삭제 실패", error);
    return Response.json(
      { error: "기사를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
