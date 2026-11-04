// 카테고리 관리 API를 부르는 클라이언트 헬퍼. 실패하면 화면에 그대로 보여 줄 안내 문구를 돌려준다.
export async function callCategoryApi(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; error: string; status?: number }
> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error ?? "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
        status: res.status,
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "네트워크 오류로 요청을 처리하지 못했어요." };
  }
}
