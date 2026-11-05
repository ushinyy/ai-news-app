// 대시보드 URL 규칙: /dashboard?category=<id|none>&q=<검색어>&page=<n>
// 서버·클라이언트 컴포넌트가 함께 쓰므로 DB 코드를 import하지 않는다.
export function dashboardHref({
  category,
  q,
  page,
}: {
  category?: string;
  q?: string;
  page?: number;
}): string {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (q) query.set("q", q);
  if (page && page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}
