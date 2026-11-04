import { SaveToNotionButton } from "@/components/save-to-notion-button";
import type { DashboardArticle } from "@/lib/dashboard";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0";

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 2026. 11. 03. -> 2026.11.03
function formatDate(date: Date | null) {
  if (!date) return null;
  return dateFormat
    .formatToParts(date)
    .filter((part) => part.type !== "literal")
    .map((part) => part.value)
    .join(".");
}

export function NewsCard({ article }: { article: DashboardArticle }) {
  const date = formatDate(article.publishedAt ?? article.createdAt);
  const saved = article.notionPageId !== null;

  return (
    <li className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* 좁은 화면에서 뱃지와 출처·날짜가 부딪히면 줄바꿈하고, 긴 카테고리명은 말줄임 처리한다. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span
          className={`max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-medium ${
            article.categoryName
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {article.categoryName ?? "미분류"}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {article.sourceName} · {date}
        </span>
      </div>

      <h2 className="mt-3 line-clamp-2 break-words text-base font-semibold leading-snug">
        {article.titleKo}
      </h2>
      <p className="mt-2 line-clamp-3 break-words text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {article.summaryKo}
      </p>

      <div className="mt-auto flex items-center gap-2 pt-5">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonBase} border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800`}
        >
          원문보기
        </a>
        <SaveToNotionButton articleId={article.id} saved={saved} />
      </div>
    </li>
  );
}
