import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";

export type NotionArticle = {
  titleKo: string;
  summaryKo: string;
  url: string;
  sourceName: string;
  categoryName: string | null;
  publishedAt: Date | null;
};

// Notion 제한: 텍스트 한 덩어리 2000자, select 이름에는 쉼표 불가.
const clip = (text: string, max: number) => text.slice(0, max);
const selectName = (text: string) => clip(text.replace(/,/g, " ").trim(), 100);

function buildProperties(article: NotionArticle) {
  const properties: Record<string, unknown> = {
    제목: { title: [{ text: { content: clip(article.titleKo, 2000) } }] },
    요약: { rich_text: [{ text: { content: clip(article.summaryKo, 2000) } }] },
    URL: { url: article.url },
    출처: { select: { name: selectName(article.sourceName) } },
  };
  // 발행일이 없으면 속성을 비워 둔다.
  if (article.publishedAt) {
    properties["발행일"] = {
      date: { start: article.publishedAt.toISOString() },
    };
  }
  if (article.categoryName) {
    properties["카테고리"] = { select: { name: selectName(article.categoryName) } };
  }
  return properties;
}

// 로컬 @notionhq/notion-mcp-server(stdio)를 띄워 페이지를 만든다. 만든 페이지 id를 돌려준다.
export async function createNotionPage(article: NotionArticle): Promise<string> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error("NOTION_TOKEN 또는 NOTION_DATABASE_ID가 설정되지 않았습니다");
  }

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.join(
        process.cwd(),
        "node_modules/@notionhq/notion-mcp-server/bin/cli.mjs",
      ),
    ],
    env: { PATH: process.env.PATH ?? "", NOTION_TOKEN: token },
    stderr: "ignore",
  });
  const client = new Client({ name: "ai-news-collector", version: "0.1.0" });

  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: "API-post-page",
      arguments: {
        parent: { database_id: databaseId },
        properties: buildProperties(article),
      },
    });
    const text = (result.content as { type: string; text?: string }[])
      .map((c) => c.text ?? "")
      .join("");
    if (result.isError) throw new Error(`Notion 페이지 생성 실패: ${text}`);

    const parsed = JSON.parse(text) as { object?: string; id?: unknown };
    const id = parsed.id;
    if (parsed.object === "error" || typeof id !== "string") {
      throw new Error(`Notion 페이지 생성 실패: ${text.slice(0, 200)}`);
    }
    return id;
  } finally {
    await client.close().catch(() => {});
  }
}
