# UI 가이드: AI 뉴스 수집기

대시보드(메인 화면)와 공통 스타일 규칙을 정리한 문서다. 기능 요구사항은 `PRD.md`를 따르고, 이 문서는 화면 구성과 Tailwind 클래스 기준만 다룬다.

## 1. 디자인 원칙

- **깔끔하게:** 장식을 줄이고 흰 배경, 얇은 테두리, 넉넉한 여백으로 구분한다. 그림자는 호버 때만 약하게 쓴다.
- **읽기 편하게:** 한국어 본문은 줄 간격을 넓히고(`leading-relaxed`), 한 카드의 요약은 3줄로 자른다.
- **한 가지 강조색:** 강조색은 인디고 하나만 쓴다. 나머지는 중립색(zinc)이다.
- **다크 모드 대응:** `globals.css`의 `prefers-color-scheme` 방식을 따르므로 모든 색에 `dark:` 짝을 둔다.

## 2. 토큰

Tailwind v4 기본 팔레트를 그대로 쓴다. 별도 설정 파일은 필요 없다.

| 용도 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `bg-zinc-50` | `dark:bg-zinc-950` |
| 카드·헤더 배경 | `bg-white` | `dark:bg-zinc-900` |
| 테두리 | `border-zinc-200` | `dark:border-zinc-800` |
| 본문 글자 | `text-zinc-900` | `dark:text-zinc-100` |
| 보조 글자 | `text-zinc-500` | `dark:text-zinc-400` |
| 강조색 | `indigo-600` (호버 `indigo-700`) | `dark:indigo-500` (호버 `indigo-400`) |

- 모서리: 카드 `rounded-xl`, 버튼·입력 `rounded-lg`, 칩·뱃지 `rounded-full`.
- 글자 크기: 앱 제목 `text-xl font-semibold`, 카드 제목 `text-base font-semibold`, 요약 `text-sm`, 메타 정보 `text-xs`.
- 폰트: `app/globals.css`의 `body`가 `Arial`로 고정되어 있어 레이아웃에서 불러온 Geist가 적용되지 않는다. 한글은 어차피 시스템 폰트로 표시되므로 `font-family`를 `var(--font-sans), system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`로 바꾸는 것을 권장한다.

## 3. 화면 구성

```
┌──────────────────────────────────────────────┐
│ AI 뉴스 수집기              [뉴스 가져오기] (👤) │  헤더 (sticky)
├──────────────────────────────────────────────┤
│  [전체] [LLM] [로봇] ... [+ 카테고리] [편집]    │  카테고리 바
│                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ 카드    │  │ 카드    │  │ 카드    │          │  카드 그리드
│  └────────┘  └────────┘  └────────┘          │
└──────────────────────────────────────────────┘
```

콘텐츠 폭은 `max-w-6xl mx-auto px-4 sm:px-6`으로 제한한다.

### 3.1 헤더

헤더는 `app/layout.tsx`에 있고, 앱 제목은 `/dashboard`로 가는 링크다. 로그인 모달과 `Show` 구조는 그대로 둔다.

```tsx
<header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
  <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
    <h1 className="text-xl font-semibold tracking-tight">AI 뉴스 수집기</h1>
    <div className="flex items-center gap-3">
      <FetchNewsButton />
      <UserButton />
    </div>
  </div>
</header>
```

`뉴스 가져오기` 버튼은 주요 버튼 스타일(§4.1)을 쓰고, 처리 중에는 스피너와 "가져오는 중…"을 보여 주며 `disabled` 처리한다. 완료 후 새 기사가 없으면 토스트나 버튼 아래 한 줄로 "새 뉴스 없음"을 안내한다.

### 3.1.1 키워드 검색 (카테고리 바 위)

`<form role="search">`에 입력창(`rounded-lg border`, `aria-label="뉴스 검색어"`)과 주요 스타일 `검색` 버튼을 한 줄로 둔다. 버튼 클릭이나 Enter로 제출하면 `/dashboard?q=<검색어>`로 이동하며, 보고 있던 카테고리는 유지하고 `page`는 1로 돌아간다. 카테고리 칩·페이지 나누기도 `q`를 유지한다. 검색 결과가 없으면 "‘검색어’ 검색 결과가 없어요" + `검색어 지우기`를 보여 준다. 칩의 개수는 검색과 무관한 전체 개수이고, 하단의 `총 N건`이 검색 결과 수다.

### 3.2 카테고리 바 (카드 목록 바로 위)

카테고리 칩을 한 줄로 늘어놓고, 칩 뒤에 **`+ 카테고리` 추가 버튼**과 **`편집`/`완료` 버튼**을 차례로 둔다. 칩이 많아지면 줄바꿈한다(`flex-wrap`). 가로 스크롤은 쓰지 않는다. 기사·카테고리가 하나도 없어도 이 바는 보여서 첫 카테고리를 만들 수 있다.

```tsx
<nav aria-label="카테고리" className="flex flex-wrap items-center gap-2 py-6">
  <CategoryChips ... />   {/* 전체 · 미분류 · 카테고리 칩 · + 카테고리 · 편집/완료. 편집 상태를 한 클라이언트 컴포넌트가 가진다 */}
</nav>
```

- **칩 (기본):** `rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800`
- **칩 (선택됨):** `border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500`, 그리고 `aria-pressed="true"`.
- **칩 안의 개수:** 이름 뒤에 `ml-1.5 text-xs opacity-60`으로 기사 수를 붙인다. 예: `LLM 12`.
- **`+ 카테고리` 버튼:** 점선 테두리로 칩과 구분한다. `rounded-full border border-dashed border-zinc-300 px-3.5 py-1.5 text-sm text-zinc-500 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-zinc-700 dark:hover:border-indigo-400 dark:hover:text-indigo-400`
- 누르면 칩 자리에서 입력창으로 바뀌는 인라인 입력(`rounded-full border px-3.5 py-1.5 text-sm`, 자동 포커스)을 쓴다. `Enter`로 추가, `Esc`나 바깥 클릭으로 취소한다. 한글 조합 중의 `Enter`는 제출로 보지 않는다. 오류(빈 이름·31자 이상·중복)는 입력창 아래 `text-xs text-red-600 dark:text-red-400`로 보여 준다.
- "미분류" 기사가 있으면 `전체` 다음에 `미분류` 칩을 보여 준다.

**편집 모드 (`편집` / `완료` 버튼)**

수정·삭제·병합은 평소에는 숨겨 두고, `+ 카테고리` 옆의 `편집` 버튼으로 편집 모드에 들어가서 한다.

- **평소:** 칩은 이름 + 개수만 보인다. `⋯` 자리도, 오른쪽 여백도 없다.
- **`편집` 버튼:** 칩보다 덜 눈에 띄는 텍스트 버튼(`rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-indigo-600`)이고 `aria-pressed`를 단다. 누르면 `완료`로 바뀌며 연한 인디고(`bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300`)가 된다. 카테고리가 하나도 없으면 숨긴다.
- **편집 모드:** **카테고리 칩에만** 오른쪽에 `⋯` 메뉴 버튼(`aria-label="<이름> 카테고리 메뉴"`)이 붙는다. `전체`·`미분류`에는 붙이지 않는다. 모바일·데스크톱이 같다(호버로 나타나지 않는다). 실수로 이동하지 않도록 **모든 칩(`전체`·`미분류` 포함)이 링크가 아니라 같은 모양의 `<span>`**이 되어 눌러도 필터가 바뀌지 않는다. `완료`를 누르면 열려 있던 메뉴도 닫힌다. 편집할 카테고리가 없어지면 자동으로 편집 모드가 풀린다.
- **`⋯` 메뉴** (`role="menu"`, `rounded-lg border bg-white shadow-md`, 방향키로 항목 이동, `Esc`·바깥 클릭으로 닫힘): `이름 수정` → `다른 카테고리로 병합` → `삭제`(빨간 글씨 `text-red-600 dark:text-red-400`). 다른 카테고리가 없으면 `병합`은 비활성이다.
- **이름 수정:** 칩 자리가 추가와 같은 인라인 입력으로 바뀐다(`Enter` 저장, `Esc` 취소). 이름이 그대로면 요청 없이 닫는다.
- **삭제·병합 확인창** (네이티브 `<dialog>`, `rounded-xl border bg-white shadow-xl`, 뒷배경 `backdrop:bg-black/40`): 제목은 `‘이름’ 카테고리를 삭제할까요?`/`병합할까요?`, 본문에 영향받는 기사 수를 적는다. 삭제는 "기사 N건은 삭제되지 않고 미분류로 이동해요", 병합은 대상 카테고리를 `<select>`로 고른 뒤 "‘A’의 기사 N건을 ‘B’(으)로 옮기고, ‘A’ 카테고리는 삭제해요"라고 보여 준다. 포커스는 `취소`에서 시작하고 `Esc`·바깥 클릭은 취소다. 실행 버튼은 위험 동작 스타일(`bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400`)이며 병합은 대상을 고르기 전까지 비활성이다. 요청 중에는 `처리 중…`과 비활성 상태이고 닫히지 않는다. 실패하면 확인창 안에 오류 배너(§5 오류 스타일)를 보여 준다.
- 보고 있던 카테고리를 삭제하거나 병합해 없애면 `전체` 보기로 돌아간다.

### 3.3 뉴스 카드 그리드

```tsx
<ul className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
```

| 화면 너비 | 열 수 |
|---|---|
| 모바일 (`< 640px`) | 1 |
| `sm` (640px~) | 2 |
| `lg` (1024px~) | 3 |

### 3.4 뉴스 카드

PRD 5.5의 구성(한국어 제목, 요약, 출처, 발행일, 카테고리 뱃지, 원문보기, 저장하기)을 따른다.

```tsx
<li className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
  <div className="flex items-center justify-between gap-2">
    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
      LLM
    </span>
    <span className="text-xs text-zinc-500 dark:text-zinc-400">TechCrunch · 2026.11.03</span>
  </div>

  <h2 className="mt-3 text-base font-semibold leading-snug">한국어 제목</h2>
  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
    한국어 요약
  </p>

  <div className="mt-auto flex items-center gap-2 pt-5">
    <a className="..." target="_blank" rel="noopener noreferrer">원문보기</a>
    <button className="...">저장하기</button>
  </div>
</li>
```

- 카드 높이를 맞추기 위해 버튼 줄에 `mt-auto`를 쓴다.
- 제목은 2줄까지만 보이게 `line-clamp-2`를 붙인다.
- 카테고리가 없는 기사의 뱃지는 `미분류`로 표시하고 `bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400`를 쓴다.
- 출처·날짜는 `·`로 구분하고 날짜 형식은 `YYYY.MM.DD`로 통일한다.

## 4. 버튼

공통: `inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50`

### 4.1 종류

| 종류 | 용도 | 추가 클래스 |
|---|---|---|
| 주요 | `뉴스 가져오기` | `bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400` |
| 보조 | `원문보기` | `border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800` |
| 저장 전 | `저장하기` | 주요 버튼의 연한 버전: `bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25` |
| 저장 후 | `저장됨` | `bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400`, `disabled` (다시 눌러도 생성되지 않음) |

저장 요청 중에는 `저장 중…`과 `disabled`를 보여 주고, 실패하면 버튼 아래에 `text-xs text-red-600 dark:text-red-400`로 오류를 적는다.

## 5. 상태 화면

| 상태 | 표시 |
|---|---|
| 가져오는 중 | 헤더 버튼 스피너. 목록이 비어 있으면 카드 모양 스켈레톤 6개(`animate-pulse`, `bg-zinc-200 dark:bg-zinc-800` 막대)를 그리드에 표시 |
| 기사 없음 (처음) | 카테고리 바(`전체 0` 칩과 `+ 카테고리`)는 그대로 보이고, 그 아래에 가운데 정렬 안내: "아직 수집한 뉴스가 없어요 / 뉴스를 수집하면 이곳에 카드로 정리돼요." (`components/empty-state.tsx`) |
| 필터 결과 없음 | "이 카테고리에는 뉴스가 없어요" + `전체 보기` 링크 |
| 새 뉴스 없음 | "새 뉴스 없음" 한 줄 안내 |
| 오류 | `rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300` 배너 |

## 6. 접근성

- 카테고리 바는 `<nav aria-label="카테고리">`, 선택 상태는 `aria-pressed`로 표시한다.
- 아이콘만 있는 버튼에는 `aria-label`을 붙인다.
- `원문보기`는 `<a>`, 동작을 일으키는 것은 `<button>`을 쓴다.
- 포커스 링을 지우지 않는다(`focus-visible:` 스타일 유지).
- 글자와 배경의 대비는 WCAG AA(4.5:1)를 유지한다. 보조 글자(`zinc-500`)는 12px 미만으로 쓰지 않는다.

## 7. 컴포넌트 파일 배치

| 파일 | 역할 |
|---|---|
| `app/page.tsx` | `/`를 `/dashboard`로 보낸다 |
| `app/dashboard/page.tsx` | 대시보드. 카테고리 바, 카드 그리드, 페이지 나누기, 로딩 스켈레톤, 빈 화면 조립 |
| `app/layout.tsx` | 헤더(앱 제목, `뉴스 가져오기`, 사용자 메뉴)와 로그인 모달(`Show` 구조) |
| `components/fetch-news-button.tsx` | `뉴스 가져오기` 버튼과 결과 안내 |
| `components/category-bar.tsx` | `<nav>` 틀(서버 컴포넌트). 안쪽은 `CategoryChips` |
| `components/category-chips.tsx` | 칩 줄 전체와 `편집`/`완료`, 편집 모드 상태 |
| `components/category-chip.tsx` | 칩 하나. 편집 모드에서는 링크 대신 `<span>` |
| `components/managed-category-chip.tsx` | 카테고리 칩 + `⋯` 메뉴(이름 수정·병합·삭제)와 확인창 연결 |
| `components/add-category.tsx` | `+ 카테고리` 버튼과 인라인 입력 |
| `components/category-name-input.tsx` | 추가·이름 수정이 함께 쓰는 인라인 입력창 |
| `components/confirm-dialog.tsx` | 삭제·병합 확인창 |
| `components/category-api.ts` | 카테고리 API 호출 헬퍼 |
| `components/news-card.tsx` | 뉴스 카드 |
| `components/search-form.tsx` | 키워드 검색창과 `검색` 버튼 |
| `components/pagination.tsx` | 페이지 나누기 |
| `components/empty-state.tsx` | 빈 화면 안내 |
| `components/sign-in-gate.tsx` | 로그인 안내 |

버튼 변형(§4)을 모으는 `components/ui/button.tsx` 같은 공용 컴포넌트는 아직 없고, 각 컴포넌트가 해당 클래스를 직접 쓴다. 서버 컴포넌트에서 클라이언트 컴포넌트로 함수를 props로 넘길 수 없으니, 클라이언트 컴포넌트는 직렬화되는 값(id·이름·개수 등)만 받는다.
