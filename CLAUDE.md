# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 현재 상태

완료: Clerk 인증 연결(`proxy.ts`, 레이아웃 로그인 모달, `components/sign-in-gate.tsx`), DB 스키마(`db/schema.ts`)·Drizzle 클라이언트(`db/index.ts`)·마이그레이션(`drizzle/`)을 만들어 Neon(`ai-news` 프로젝트)에 반영, Neon MCP 연결(`.mcp.json`).
미구현: `lib/`(RSS·Claude·Notion), API 라우트, 기사 카드 UI. 요구사항·데이터 모델·구조의 기준 문서는 `PRD.md`(한국어)다. 기능을 구현하기 전에 반드시 읽을 것.

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

테스트 러너는 아직 설정되어 있지 않다. 프레임워크: App Router, TypeScript, Tailwind v4, import alias `@/*`, `src/` 없음(`app/`이 루트).

## 아키텍처 (PRD 기준, 구현 예정)

RSS(TechCrunch AI, The Verge AI) → Claude가 제목 번역·한국어 요약·카테고리 생성 → Neon Postgres(Drizzle) 저장 → 카드 UI → 선택한 기사를 Notion DB에 저장.

- `lib/rss.ts` 피드 fetch·파싱, `lib/claude.ts` 기사를 묶어 요청해 JSON(`titleKo`, `summaryKo`, `category`) 수신, `lib/notion.ts` MCP 클라이언트로 `@notionhq/notion-mcp-server`를 호출해 페이지 생성, `db/schema.ts`·`db/index.ts`.
- API: `fetch-news`, `articles/[id]/notion`, `categories`.
- 모든 페이지·API는 Clerk 로그인 필수이고, 모든 데이터는 Clerk `userId`로 분리한다.

### 핵심 규칙 (여러 파일에 걸침)

- **중복 방지:** URL을 정규화(트래킹 파라미터·말미 슬래시 제거)하고 DB `(userId, url)` unique 제약으로 보장한다. DB에 이미 있는 URL은 **Claude 호출 전에** 걸러낸다.
- **카테고리 재사용:** 분류 프롬프트에 사용자의 기존 카테고리 목록을 넘겨 재사용을 지시하고, 없을 때만 짧은 한국어 명사구로 새로 제안한다. 카테고리 삭제 시 기사는 미분류(`categoryId` set null)로 이동한다. `(userId, name)` unique.
- **Notion 저장 멱등성:** 저장 후 `articles.notionPageId`를 기록하고, 이미 있으면 다시 생성하지 않는다.
- Claude 호출은 배치 처리하고 최대 건수 제한을 둔다.
- Notion MCP는 stdio 서버라 로컬 실행 기준이다. Vercel 배포는 범위 밖(호스팅 방식 재논의 필요).

## 환경변수 (`.env.local`, git 제외)

- 값이 채워진 것: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`
- 아직 비어 있는 것: `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`

## 예제 데이터

Neon DB에는 화면 확인용 예제 데이터(카테고리 3개, 기사 5개)가 들어 있다. 모두 가상의 기사이며 `user_id`는 임시값 `user_sample_001`이다. 실제 Clerk `userId`가 아니므로 로그인한 계정에서는 보이지 않는다. 실제 연동 전에 삭제하거나 본인 `userId`로 바꿀 것.

## 커밋 규칙

커밋 메시지는 한글로 쓴다.
