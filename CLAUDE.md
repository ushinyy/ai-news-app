# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 현재 상태

완료: Clerk 인증 연결(`proxy.ts`, 레이아웃 로그인 모달, `components/sign-in-gate.tsx`), DB 스키마(`db/schema.ts`)·Drizzle 클라이언트(`db/index.ts`)·마이그레이션(`drizzle/`)을 만들어 Neon(`ai-news` 프로젝트)에 반영, Neon MCP 연결(`.mcp.json`).
완료(화면): 대시보드(`app/dashboard/page.tsx`: 카테고리 바, 카드 그리드, 로딩 스켈레톤, 빈 화면), 뉴스 카드, 헤더의 `뉴스 가져오기` 버튼(`components/fetch-news-button.tsx`), 페이지 나누기(페이지당 9건, `components/pagination.tsx`, `?page=N`이 `?category=`와 함께 유지됨, 데이터는 `lib/dashboard.ts`).
완료(수집): `뉴스 가져오기` → `POST /api/fetch-news` → `lib/fetch-news.ts`의 `collectNews`가 `lib/rss.ts`로 TechCrunch AI·The Verge AI에서 **최근 24시간** 기사만 읽어(발행일 없는 항목 제외, 피드 하나가 실패해도 나머지는 저장) DB에 없는 URL만 insert한다.
완료(Claude): `collectNews`가 DB에 없는 URL만 최신순 30건까지 10건씩 배치로 `lib/claude.ts`의 `enrichArticles`(Haiku `claude-haiku-5-5`, 강제 tool use)에 보내 `titleKo`·`summaryKo`·카테고리를 받아 저장한다. 기존 카테고리는 프롬프트로 넘겨 재사용하고 새 이름만 `categories`에 만든다. 배치가 실패하면 그 기사들은 저장하지 않아 다음 가져오기에서 재시도된다(`failedArticles`), 30건 초과분은 `remaining`으로 알린다. `ANTHROPIC_API_KEY`가 필요하다.
완료(카테고리 관리): 카테고리 바의 `+ 카테고리`(인라인 입력, Enter 추가·Esc 취소)와 `편집`/`완료` 버튼. 편집 모드에서만 카테고리 칩에 `⋯` 메뉴(이름 수정·병합·삭제)가 나타나고 이때는 모든 칩이 필터 이동을 하지 않는다(`components/category-chips.tsx`, `managed-category-chip.tsx`). 삭제·병합은 `components/confirm-dialog.tsx` 확인창에서 영향받는 기사 수를 보여 준다. 로직은 `lib/categories.ts`, API는 `POST /api/categories`, `PATCH`·`DELETE /api/categories/[id]`, `POST /api/categories/[id]/merge`. 기사·카테고리가 없어도 카테고리 바는 보인다.
완료(Notion): 카드의 `저장하기`(`components/save-to-notion-button.tsx`) → `POST /api/articles/[id]/notion` → `lib/notion.ts`가 로컬 `@notionhq/notion-mcp-server`(stdio)를 띄워 `API-post-page`로 `AI 뉴스 북마크` DB에 페이지를 만들고 `notionPageId`를 기록, 버튼은 `저장됨`으로 바뀐다. Notion 속성명: 제목·요약·URL·출처·카테고리·발행일.
요구사항·데이터 모델·구조의 기준 문서는 `PRD.md`(한국어)다. 기능을 구현하기 전에 반드시 읽을 것.
화면·UI를 만들거나 고칠 때는 `ui.md`(Tailwind 기반 UI 가이드: 대시보드 구성, 카테고리 바, 뉴스 카드, 버튼·상태 스타일)를 먼저 읽고 따른다.

## Next.js 주의

이 프로젝트의 Next.js(16.x)는 학습 데이터와 다른 breaking change가 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 관련 가이드를 읽고 deprecation 안내를 따른다 (`AGENTS.md` 참고).

## 명령어

```bash
npm run dev     # 개발 서버 (http://localhost:3000)
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
npx drizzle-kit generate   # 스키마 변경 후 마이그레이션 SQL 생성
npx drizzle-kit migrate    # 생성된 마이그레이션을 Neon(DATABASE_URL)에 적용
```

### 슬래시 명령

- `/news-workflow <브랜치-이름>` (`.claude/commands/news-workflow.md`): 새 기능 개발 워크플로. main 확인 → 브랜치 생성(이름이 없으면 영어 소문자-하이픈으로 제안) → 개발 시작 안내와 기술 스택·컨벤션 재안내 → `완료`/`done` 입력 시 변경 파일 목록·한글 커밋 메시지 제안 후 커밋·main 병합 → 작업 요약.

테스트 러너는 아직 설정되어 있지 않다. 프레임워크: App Router, TypeScript, Tailwind v4, import alias `@/*`, `src/` 없음(`app/`이 루트).

## 아키텍처 (PRD 기준)

RSS(TechCrunch AI, The Verge AI) → Claude가 제목 번역·한국어 요약·카테고리 생성 → Neon Postgres(Drizzle) 저장 → 카드 UI → 선택한 기사를 Notion DB에 저장. 이 중 모든 단계가 구현됐다.

- `lib/rss.ts` 피드 fetch·파싱·URL 정규화(구현), `lib/fetch-news.ts` 수집·중복 제거·저장(구현), `lib/dashboard.ts` 대시보드 조회·페이지 계산(구현), `lib/claude.ts` 기사를 묶어 요청해 `titleKo`·`summaryKo`·`category` 수신(구현). `lib/notion.ts` MCP 클라이언트로 `@notionhq/notion-mcp-server`를 호출해 페이지 생성(구현). DB는 `db/schema.ts`·`db/index.ts`.
- API: `fetch-news`, `categories`(추가·수정·삭제·병합)는 구현, `articles/[id]/notion`도 구현.
- DB는 `neon-http` 드라이버라 `db.transaction()`을 쓸 수 없다(오류). 여러 쿼리를 원자적으로 묶을 때는 `db.batch([...])`를 쓴다(병합·삭제가 이 방식).
- 페이지네이션 URL 규칙: `/dashboard?category=<id|none>&page=<n>`. 1페이지는 `page`를 생략하고, 범위를 넘은 `page`는 마지막 페이지로 맞춘다. 목록 정렬은 발행일 최신순(`published_at desc nulls last`, `created_at`, `id`).
- 키워드 검색: `?q=`(공백 정리, 100자 제한)를 `lib/dashboard.ts`의 `parseQuery`/`searchCondition`이 처리한다. 공백으로 나눈 단어마다 `titleKo`·`titleOriginal`·`summaryKo` 중 하나에 `ilike`로 포함돼야 한다. URL은 `lib/dashboard-url.ts`의 `dashboardHref`로 만들어 `category`·`q`·`page`를 함께 유지한다. 검색어가 바뀌면 `page`는 1로 돌아간다.
- 서버 컴포넌트에서 클라이언트 컴포넌트로 함수를 props로 넘길 수 없다(예: `Pagination`은 href를 안에서 만든다).
- 모든 페이지·API는 Clerk 로그인 필수이고, 모든 데이터는 Clerk `userId`로 분리한다.

### 핵심 규칙 (여러 파일에 걸침)

- **중복 방지:** URL을 정규화(트래킹 파라미터·말미 슬래시 제거)하고 DB `(userId, url)` unique 제약으로 보장한다. DB에 이미 있는 URL은 **Claude 호출 전에** 걸러낸다.
- **카테고리 재사용:** 분류 프롬프트에 사용자의 기존 카테고리 목록을 넘겨 재사용을 지시하고, 없을 때만 짧은 한국어 명사구로 새로 제안한다. 카테고리 삭제 시 기사는 미분류(`categoryId` set null)로 이동한다. `(userId, name)` unique. 이름 규칙(공백 정리, 대소문자 무시 중복 비교, 30자 제한)은 `lib/category-name.ts` 한 곳에 두고 가져오기(`lib/claude.ts`)와 관리 API·화면이 같이 쓴다.
- **Notion 저장 멱등성:** 저장 후 `articles.notionPageId`를 기록하고, 이미 있으면 다시 생성하지 않는다.
- Claude 호출은 배치 처리하고 최대 건수 제한을 둔다.
- **Notion 연동 주의:** `lib/notion.ts`는 저장할 때마다 stdio 서버를 새로 띄운다. 로컬 서버는 `NOTION_TOKEN`(통합 토큰)을 쓰며 `/mcp`로 연결한 호스티드 Notion과 별개다. 속성 `URL`은 로컬 API에서는 `URL`이고 호스티드 MCP의 `userDefined:URL`과 다르다. 카테고리는 저장 시점의 이름이 Notion select에 복사될 뿐이라, 이후 카테고리 이름 수정·병합·삭제는 이미 저장된 Notion 페이지와 select 선택지에 반영되지 않는다(동기화 미구현).
- Notion MCP는 stdio 서버라 로컬 실행 기준이다. Vercel 배포는 범위 밖(호스팅 방식 재논의 필요).

## 환경변수 (`.env.local`, git 제외)

- 값이 채워진 것: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`
- `NOTION_TOKEN`, `NOTION_DATABASE_ID`도 채워져 있다.

## 커밋 규칙

커밋 메시지는 한글로 쓴다.
