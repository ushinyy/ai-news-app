import { auth } from "@clerk/nextjs/server";
import {
  CATEGORY_ERROR_STATUS,
  deleteCategory,
  renameCategory,
} from "@/lib/categories";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) {
    return Response.json(
      { error: "카테고리를 찾을 수 없어요." },
      { status: 404 },
    );
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
    const result = await renameCategory(userId, Number(rawId), body.name);
    if (!result.ok) {
      return Response.json(
        { error: result.message },
        { status: CATEGORY_ERROR_STATUS[result.code] },
      );
    }
    return Response.json({ category: result.value });
  } catch (error) {
    console.error("카테고리 이름 수정 실패", error);
    return Response.json(
      { error: "카테고리 이름을 바꾸는 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}

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
    return Response.json(
      { error: "카테고리를 찾을 수 없어요." },
      { status: 404 },
    );
  }

  try {
    const result = await deleteCategory(userId, Number(rawId));
    if (!result.ok) {
      return Response.json(
        { error: result.message },
        { status: CATEGORY_ERROR_STATUS[result.code] },
      );
    }
    return Response.json({ unassigned: result.value.unassigned });
  } catch (error) {
    console.error("카테고리 삭제 실패", error);
    return Response.json(
      { error: "카테고리를 삭제하는 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
