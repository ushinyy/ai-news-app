import Parser from "rss-parser";

export const FEEDS = [
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
] as const;

export type FeedArticle = {
  sourceName: string;
  url: string;
  titleOriginal: string;
  summary: string;
  publishedAt: Date;
};

const SUMMARY_MAX = 300;
const FETCH_TIMEOUT_MS = 10_000;

const parser = new Parser();

// 트래킹 파라미터·해시·말미 슬래시를 없애 같은 기사가 같은 URL이 되게 한다.
export function normalizeUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  u.hash = "";
  for (const key of [...u.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ["fbclid", "gclid", "mc_cid", "mc_eid", "ref"].includes(key.toLowerCase())) {
      u.searchParams.delete(key);
    }
  }
  const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : u.pathname;
  const search = u.searchParams.toString();
  return `${u.protocol}//${u.host.toLowerCase()}${path}${search ? `?${search}` : ""}`;
}

function toSummary(html: string | undefined): string {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#039;|&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > SUMMARY_MAX ? `${text.slice(0, SUMMARY_MAX - 1)}…` : text;
}

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<FeedArticle[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-news-collector)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${feed.name} 응답 ${res.status}`);

  const parsed = await parser.parseString(await res.text());
  const items: FeedArticle[] = [];
  for (const item of parsed.items) {
    const url = item.link ? normalizeUrl(item.link) : null;
    const title = item.title?.trim();
    const publishedAt = item.isoDate ? new Date(item.isoDate) : null;
    // 발행일을 알 수 없으면 24시간 기준을 적용할 수 없으므로 건너뛴다.
    if (!url || !title || !publishedAt || Number.isNaN(publishedAt.getTime())) continue;
    items.push({
      sourceName: feed.name,
      url,
      titleOriginal: title,
      summary: toSummary(item.contentSnippet ?? item.content ?? item.summary),
      publishedAt,
    });
  }
  return items;
}

// 최근 `hours`시간 안에 발행된 기사만 돌려준다. 피드 하나가 실패해도 나머지는 계속 처리한다.
export async function fetchRecentArticles(hours = 24) {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  const byUrl = new Map<string, FeedArticle>();
  const failedFeeds: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      failedFeeds.push(FEEDS[i].name);
      return;
    }
    for (const article of result.value) {
      if (article.publishedAt.getTime() >= since && !byUrl.has(article.url)) {
        byUrl.set(article.url, article);
      }
    }
  });

  return { articles: [...byUrl.values()], failedFeeds };
}
