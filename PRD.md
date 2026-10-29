# PRD: AI 뉴스 수집·요약 앱

## 1. 개요
해외 AI 뉴스를 RSS로 수집해 Claude가 한국어로 번역·요약·분류하고, 카드 형태로 보여주며 원하는 뉴스를 Notion에 저장하는 웹 앱.

## 2. 목표
- 해외 AI 뉴스를 한국어로 빠르게 훑어본다.
- 뉴스를 카테고리별로 골라 본다.
- 중요한 뉴스는 Notion에 모아 둔다.

## 3. 뉴스 소스 (RSS)
- TechCrunch AI: https://techcrunch.com/category/artificial-intelligence/feed/
- The Verge AI: https://www.theverge.com/rss/ai-artificial-intelligence/index.xml

## 4. 기술 스택
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router, TypeScript) |
| 인증 | Clerk |
| DB | Neon (Postgres) + Drizzle ORM |
| 번역/요약/분류 | Claude API |
| Notion 저장 | Notion MCP 서버 (`@notionhq/notion-mcp-server`, 통합 토큰 방식) |

## 5. 기능 요구사항

### 5.1 로그인
- 앱 실행 시 Clerk 로그인이 선행되어야 하며, 미로그인 상태에서는 모든 페이지·API 접근을 차단한다.
- 모든 데이터(뉴스, 카테고리)는 Clerk `userId` 기준으로 사용자별 분리한다.

### 5.2 뉴스 가져오기
- `뉴스 가져오기` 버튼을 누르면 두 RSS 피드를 읽어 새 기사만 처리한다.
- Claude가 각 기사의 제목 번역, 한국어 요약, 카테고리를 생성한다.
- 처리 중 로딩 상태를 표시하고, 완료 후 목록을 갱신한다. 새 기사가 없으면 "새 뉴스 없음"을 안내한다.

### 5.3 중복 처리
- 같은 뉴스는 `뉴스 가져오기`를 다시 눌러도 저장되지 않는다.
- 판별 기준은 정규화한 URL(트래킹 파라미터·말미 슬래시 제거)이며, DB의 `(userId, url)` unique 제약으로 보장한다.
- DB에 이미 있는 URL은 Claude 호출 전에 걸러 API 비용을 줄인다.

### 5.4 카테고리
- 자동 분류: 고정 목록 없이 Claude가 자유롭게 카테고리를 제안하고, 새 카테고리는 자동 생성된다.
- 난립 방지: 분류 프롬프트에 사용자의 기존 카테고리 목록을 주고, 맞는 것이 있으면 재사용하고 없을 때만 새 이름(짧은 한국어 명사구)을 제안하도록 지시한다.
- 필터: 카테고리를 선택하면 해당 뉴스만 보여준다(전체 보기 포함).
- 관리: 카테고리를 추가·이름 수정·삭제할 수 있고, 비슷한 카테고리는 병합할 수 있다. 삭제된 카테고리의 기사는 미분류로 이동한다.

### 5.5 뉴스 카드
- 구성: 한국어 제목, 한국어 요약, 출처, 발행일, 카테고리 뱃지, `원문보기`, `저장하기`.
- `원문보기`: 원문 URL을 새 탭으로 연다(`rel="noopener noreferrer"`).
- `저장하기`: 해당 뉴스를 지정한 Notion 데이터베이스 하나에 페이지로 저장한다. 저장 후 "저장됨"으로 표시하고, 다시 눌러도 중복 생성하지 않는다(`notionPageId` 기록).

## 6. 데이터 모델 (Drizzle)
- `categories`: id, userId, name, createdAt — `(userId, name)` unique
- `articles`: id, userId, sourceName, url, titleOriginal, titleKo, summaryKo, publishedAt, categoryId (nullable, 삭제 시 set null), notionPageId (nullable), createdAt — `(userId, url)` unique

## 7. 구조
- `lib/rss.ts`: 피드 fetch·파싱
- `lib/claude.ts`: 기사를 묶어 요청해 JSON(titleKo, summaryKo, category)으로 응답받음
- `lib/notion.ts`: MCP 클라이언트로 Notion MCP 서버를 호출해 페이지 생성
- `db/schema.ts`, `db/index.ts`
- API: `fetch-news`, `articles/[id]/notion`, `categories`
- 환경변수: Clerk 키, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`

## 8. 비기능·제약
- 서버리스(Vercel)에서는 stdio MCP 서버 상시 실행이 어려우므로 로컬 실행을 기준으로 시작하고, 배포 시 호스팅 방식을 다시 논의한다.
- 기사 수가 많을 때를 대비해 배치 처리와 최대 건수 제한을 둔다.
- 자유 카테고리는 시간이 지나면 난립할 수 있어 재사용 지시와 병합 기능으로 대응한다.

## 9. 범위 밖 (이번 버전)
- 다른 RSS 소스 추가 UI
- 자동 주기 수집(수동 버튼만 제공)
- 사용자별 Notion 연결(OAuth)

## 10. 검증 시나리오
1. 로그아웃 상태에서 접근이 차단되고, 다른 계정의 데이터가 보이지 않는다.
2. `뉴스 가져오기`를 연속 두 번 눌러도 중복 행이 없고, 두 번째는 Claude 호출 없이 "새 뉴스 없음"이 표시된다.
3. Claude가 제안한 카테고리가 자동 생성되고, 이후 가져오기에서 기존 카테고리가 재사용된다.
4. 카테고리 추가·수정·삭제·병합 후 필터가 올바르게 동작한다.
5. `저장하기`를 누르면 지정한 Notion DB에 페이지가 1개 생기고, 다시 눌러도 늘지 않는다.
6. `원문보기`가 원문을 새 탭에서 연다.
