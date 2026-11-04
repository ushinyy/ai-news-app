# AI 뉴스 수집·요약 앱

해외 AI 뉴스를 RSS로 모아 Claude가 한국어로 번역·요약·분류해 카드로 보여 주고, 마음에 드는 뉴스는 Notion 데이터베이스에 저장하는 웹 앱입니다.

## 주요 기능

- **뉴스 가져오기:** TechCrunch AI, The Verge AI 피드에서 최근 24시간 기사를 읽어 새 기사만 처리합니다. 같은 기사는 정규화한 URL로 걸러내 다시 저장하지 않습니다.
- **번역·요약·분류:** Claude(Haiku)가 제목 번역, 한국어 요약, 카테고리를 만듭니다. 기존 카테고리가 있으면 재사용합니다.
- **카테고리:** 카테고리별 필터, 추가·이름 수정·삭제·병합을 지원합니다. 삭제하면 기사는 미분류로 이동합니다.
- **카드 목록:** 페이지당 9건, 최신순으로 보여 줍니다.
- **Notion 저장:** 카드의 `저장하기`를 누르면 Notion 데이터베이스에 페이지가 생기고 버튼이 `저장됨`으로 바뀝니다. 다시 눌러도 중복 생성하지 않습니다.
- **로그인:** Clerk 로그인이 필수이며, 모든 데이터는 사용자별로 분리됩니다.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React, TypeScript, Tailwind CSS v4 |
| 인증 | Clerk |
| DB | Neon (Postgres) + Drizzle ORM |
| AI | Claude API (`@anthropic-ai/sdk`) |
| Notion 저장 | `@notionhq/notion-mcp-server` (stdio, MCP 클라이언트로 호출) |

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 채웁니다(git에 올라가지 않습니다).

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=          # Neon 연결 문자열
ANTHROPIC_API_KEY=
NOTION_TOKEN=          # Notion 통합 토큰
NOTION_DATABASE_ID=    # 저장할 Notion 데이터베이스 ID
```

### 3. Notion 데이터베이스 준비

통합(Integration)을 만들어 데이터베이스에 연결하고, 아래 속성을 정확히 같은 이름으로 만들어 둡니다.

| 속성 | 유형 |
|---|---|
| 제목 | 제목(Title) |
| 요약 | 텍스트 |
| URL | URL |
| 출처 | 선택(Select) |
| 카테고리 | 선택(Select) |
| 발행일 | 날짜 |

### 4. DB 마이그레이션

```bash
npx drizzle-kit migrate
```

### 5. 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 로그인한 뒤 `뉴스 가져오기`를 눌러 시작합니다.

## 명령어

```bash
npm run dev                 # 개발 서버
npm run build               # 프로덕션 빌드
npm run lint                # ESLint
npx drizzle-kit generate    # 스키마 변경 후 마이그레이션 SQL 생성
npx drizzle-kit migrate     # 마이그레이션을 DB에 적용
```

## 폴더 구조

```
app/            페이지와 API 라우트 (dashboard, api/fetch-news, api/categories, api/articles)
components/     UI 컴포넌트 (뉴스 카드, 카테고리 바, 저장 버튼 등)
lib/            rss, fetch-news, claude, categories, dashboard, notion
db/             Drizzle 스키마와 클라이언트
drizzle/        마이그레이션 SQL
PRD.md          요구사항·데이터 모델 기준 문서
ui.md           UI 가이드
```

## 알아둘 점

- Notion 저장은 저장할 때마다 로컬에서 MCP 서버(stdio)를 띄우므로 **로컬 실행을 기준**으로 합니다. Vercel 같은 서버리스 배포는 범위 밖입니다.
- 카테고리는 저장 시점의 이름이 Notion에 복사됩니다. 이후 앱에서 카테고리를 수정·병합·삭제해도 이미 저장된 Notion 페이지에는 반영되지 않습니다.
- 한 번에 Claude에 보내는 기사는 최대 30건이며, 넘치는 기사는 다음 가져오기에서 처리됩니다.
