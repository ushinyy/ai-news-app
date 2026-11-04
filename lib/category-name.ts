// 카테고리 이름 규칙. 뉴스 가져오기(lib/claude.ts)와 카테고리 관리 API·화면이 모두 이 규칙을 쓴다.
// 클라이언트 컴포넌트에서도 import하므로 서버 전용 코드를 넣지 않는다.

export const CATEGORY_NAME_MAX = 30;

// 저장되는 값: 연속 공백을 한 칸으로 줄이고 앞뒤 공백을 제거한다.
export function normalizeCategoryName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

// 같은 이름인지 비교할 때 쓰는 키: 정리한 이름을 소문자로 바꾼 값. ("LLM", " llm "은 같은 이름)
export function categoryKey(name: string) {
  return normalizeCategoryName(name).toLowerCase();
}

// 문제가 있으면 사용자에게 보여 줄 안내 문구를, 없으면 null을 돌려준다.
export function validateCategoryName(name: string): string | null {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return "카테고리 이름을 입력해 주세요.";
  if ([...normalized].length > CATEGORY_NAME_MAX) {
    return `카테고리 이름은 ${CATEGORY_NAME_MAX}자 이하로 입력해 주세요.`;
  }
  return null;
}
