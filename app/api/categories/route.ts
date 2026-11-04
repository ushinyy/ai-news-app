import { auth } from "@clerk/nextjs/server";
import { CATEGORY_ERROR_STATUS, createCategory } from "@/lib/categories";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
  } | null;
  if (typeof body?.name !== "string") {
    return Response.json(
      { error: "카테고리 이름을 입력해 주세요." },
      { status: 400 },
    );
  }

  try {
    const result = await createCategory(userId, body.name);
    if (!result.ok) {
      return Response.json(
        { error: result.message },
        { status: CATEGORY_ERROR_STATUS[result.code] },
      );
    }
    return Response.json({ category: result.value }, { status: 201 });
  } catch (error) {
    console.error("카테고리 추가 실패", error);
    return Response.json(
      { error: "카테고리를 추가하는 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
