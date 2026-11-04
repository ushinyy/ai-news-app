import { auth } from "@clerk/nextjs/server";
import { FEEDS } from "@/lib/rss";
import { collectNews } from "@/lib/fetch-news";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  try {
    const result = await collectNews(userId);
    // 모든 피드가 실패했다면 "새 뉴스 없음"이 아니라 오류로 알린다.
    if (result.added === 0 && result.failedFeeds.length === FEEDS.length) {
      return Response.json(
        { error: "뉴스 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
        { status: 502 },
      );
    }
    return Response.json(result);
  } catch (error) {
    console.error("fetch-news 실패", error);
    return Response.json(
      { error: "뉴스를 저장하는 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
