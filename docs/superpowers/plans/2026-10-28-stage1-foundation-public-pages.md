# 1단계: 기반과 방문자 화면 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **이 프로젝트의 실행 방식:** 협업 규칙(`C:/Users/bhr46/.codex-collab/RULES.md`)에 따라 Codex가 superpowers:executing-plans 방식으로 작업 1부터 9까지 순서대로 실행한다. 계획에 적힌 코드를 그대로 옮겨 적는다. 계획이 모호하거나 틀렸거나 같은 오류에 두 번 막히면 그 자리에서 멈추고 `collab/HANDOFF.md`에 적는다.

**Goal:** 누구나 로그인 없이 볼 수 있는 홈(자기소개, 대표작, 전체 작품과 걸러 보기)과 작품 상세 페이지를 로컬 D1 데이터로 띄운다.

**Architecture:** Astro 7을 서버 렌더링으로 Cloudflare Workers에 올린다. 바인딩은 `import { env } from "cloudflare:workers"`로 읽는다. DB 조회는 `db: D1Database`를 인자로 받는 함수로 분리한다. 정렬, 걸러 보기, 요약 같은 규칙은 순수 함수로 두어 Workers 런타임 안에서 Vitest로 검증한다. 방문자 화면은 JavaScript 없이도 동작하고, 걸러 보기는 GET 폼과 서버 처리로 한다.

**Tech Stack:** Astro 7.4.2, @astrojs/cloudflare 14.4.2, wrangler 4.154.0, D1, Vitest 5.0.5 + @cloudflare/vitest-plugin 1.4.9, TypeScript 6.0.3, Pretendard 1.3.9

**Spec:** `docs/superpowers/specs/2026-10-27-portfolio-site-design.md` (3장 화면, 4장 데이터, 5.5 링크 미리보기, 5.6 오류 처리, 6.3 화면 확인, 10장 1단계)

## 실행 계약

- **기준:** `main` 브랜치에서 이 계획 파일을 커밋한 지점. 바로 앞 커밋은 스펙 커밋 `d3011fd`이다.
- **완료 기준:**
  1. `npm test`: 10개 테스트 파일, 51개 테스트 통과
  2. `npm run check`: `0 errors`
  3. `npm run build`: `Complete!`
  4. `npm run db:migrate:local`, `npm run db:seed:local`을 실행한 뒤 `npm run smoke`의 마지막 줄이 `smoke: 20 passed, 0 failed`
  5. `collab/HANDOFF.md` 작성
- **만들어도 되는 파일(이 목록 밖의 파일은 만들거나 고치지 않는다):**
  - 루트: `package.json`, `package-lock.json`(npm이 만듦), `astro.config.mjs`, `wrangler.jsonc`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `AGENTS.md`
  - `migrations/0001_init.sql`, `seed/dev.sql`, `scripts/smoke.mjs`, `public/favicon.svg`
  - `src/lib/types.ts`, `src/lib/format.ts`
  - `src/lib/db/rows.ts`, `src/lib/db/works.ts`, `src/lib/db/profile.ts`
  - `src/lib/works/sort.ts`, `src/lib/works/filter.ts`, `src/lib/works/summary.ts`, `src/lib/works/youtube.ts`, `src/lib/works/fieldColor.ts`
  - `src/styles/global.css`, `src/layouts/BaseLayout.astro`
  - `src/components/ProfileHero.astro`, `src/components/WorkCard.astro`, `src/components/FilterBar.astro`, `src/components/EmptyState.astro`
  - `src/pages/index.astro`, `src/pages/404.astro`, `src/pages/500.astro`, `src/pages/works/[slug].astro`
  - `test/apply-migrations.ts`, `test/env.d.ts`, `test/helpers/factories.ts`, `test/helpers/db.ts`
  - `test/db/schema.test.ts`, `test/db/rows.test.ts`, `test/db/works.test.ts`, `test/db/profile.test.ts`
  - `test/lib/sort.test.ts`, `test/lib/filter.test.ts`, `test/lib/summary.test.ts`, `test/lib/youtube.test.ts`, `test/lib/fieldColor.test.ts`, `test/lib/format.test.ts`
  - `collab/HANDOFF.md`
- **금지 범위:**
  - 관리자 화면, 로그인, 쿠키, `robots.txt`, 서식 정리(5.3), R2 바인딩, 파일 업로드·제공, 갤러리·첨부 목록, 프로필 사진, 비공개 미리보기: 2~3단계에서 한다.
  - `docs/` 아래 파일은 고치지 않는다. 추적되지 않는 `docs/포트폴리오-사이트-설계서.pdf`는 건드리지도, 커밋하지도 않는다.
  - `wrangler login`, `wrangler deploy`, `--remote`가 붙은 명령, `git push`, 전역 설치, `npm approve-scripts`는 실행하지 않는다.
  - 패키지 버전을 바꾸지 않는다. 계획에 없는 리팩터링, 기능, 디자인 변경을 하지 않는다.

## Global Constraints

- Node.js 22.23.4 이상(이 PC는 24.19.0). 패키지는 `package.json`에 적은 정확한 버전만 쓴다.
- npm 11은 의존성 설치 스크립트를 막고 `allow-scripts` 경고를 낸다. 정상이다. `workerd`와 `esbuild`는 스크립트 없이 동작함을 확인했다.
- 바인딩은 `import { env } from "cloudflare:workers"`로 읽는다. `Astro.locals.runtime`은 Astro 6부터 없다. 테스트도 `cloudflare:test`의 `env`가 아니라(지원 중단) `cloudflare:workers`의 `env`를 쓴다.
- 한국어 문구는 계획의 코드와 글자 하나까지 같게 쓴다(스펙 3장).
- 비공개 작품(`is_public = 0`)은 방문자에게 목록에서 빠지고 상세 페이지는 404다(스펙 3.1).
- 정렬 날짜: 참가일 → 작업 시작일 → 등록일. 최신순, 같으면 등록일 최신순(스펙 4.1).
- 한 줄 요약이 비면 설명에서 서식을 뺀 앞 120자를 쓴다(스펙 4.1).
- 유튜브 `watch?v=`, `youtu.be/`, `shorts/` 주소만 `youtube-nocookie.com` 퍼가기로 넣는다(스펙 3.1).
- 화면 폭이 좁으면 카드 1열, 넓으면 2~3열(스펙 3.3).
- Astro 7은 Rust 컴파일러를 쓰고 잘못된 HTML 중첩을 고쳐 주지 않는다. `<p>` 안에 블록 요소를 넣지 않는다.
- D1 테스트는 같은 파일 안의 테스트끼리 데이터가 격리되지 않는다. DB를 쓰는 테스트 파일은 `beforeEach`에서 `resetDb(env.DB)`를 부른다.

## Review Focus

스펙이 직접 말하지 않지만 실제 사용에서 깨지기 쉬운 입력 다섯 가지와, 이를 고정하는 테스트다.

1. **한글 작품 주소와 한글 검색 조건**(`/works/%EC%BA%A0...`, `?field=%EB%94%94...`): 정상으로 해석되어야 한다. `test/lib/filter.test.ts`의 "한글 분야" 테스트, `test/db/works.test.ts`의 "한글 slug" 테스트, 화면 점검의 "상세 200 (한글 주소)"가 고정한다.
2. **DB 안의 깨진 JSON이나 잘못된 링크**(`{oops`, `javascript:` 주소): 페이지가 죽지 않고 빈 목록으로 처리되어야 한다. `test/db/rows.test.ts`의 "깨진 JSON", "규칙에 맞지 않는 링크" 테스트가 고정한다.
3. **잘못된 걸러 보기 값**(`?year=abcd`, `?year=20255`, `?award=true`, 공백 분야): 조건이 없는 것으로 무시되어야 한다. `test/lib/filter.test.ts`의 "잘못된 값은 무시한다"와 화면 점검의 `{"year":"abcd"}`가 고정한다.
4. **선택 항목이 모두 빈 작품**: 상세 페이지에 빈 제목이나 빈 칸이 나오면 안 된다. 시드의 `메모-위젯`과 화면 점검의 "빈 선택 항목은 표시하지 않음"이 고정한다.
5. **공개 작품이 0개이거나 조건에 맞는 작품이 없을 때**: 두 경우를 다른 안내 문구로 보여주어야 한다. `test/lib/filter.test.ts`의 `emptyStateMessage` 테스트와 화면 점검의 "조건 불일치 안내"가 고정한다.

## 스펙과 다르게 정한 것

- 스펙 10장은 `AGENTS.md`를 4단계에 두었지만, 협업 규칙상 빌드 명령이 처음부터 그 파일에 있어야 하므로 작업 1에서 만든다.
- 스펙 5.5는 `twitter:card=summary_large_image`라고 했지만, 이미지가 없을 때 큰 카드는 의미가 없어서 이미지가 있으면 `summary_large_image`, 없으면 `summary`로 한다. 1단계에는 이미지가 없다(3단계에서 생김).
- 스펙 5.6의 방문자 오류 화면을 위해 `src/pages/500.astro`를 만든다.
- 스펙 4.3 테이블 요약에 맞추어 1단계에서 네 테이블을 모두 만든다. 그래야 2~3단계에서 마이그레이션을 다시 쓰지 않는다.
- 1단계는 시드 데이터의 설명 HTML을 그대로 보여준다. 저장할 때 서식을 정리하는 기능(5.3)은 2단계에서 관리자 화면과 함께 만든다.

## 사전 검증

Claude가 이 계획의 모든 파일을 공백이 있는 임시 경로에서 같은 버전으로 만들어 아래 결과를 확인했다.

- `npm test` 51개 통과(두 번 실행해도 같음)
- `npm run check` 0 errors
- `npm run build` 성공
- `npm run smoke` 20개 통과
- 375px, 1024px, 1280px 폭 스크린샷

계획의 코드 블록은 검증한 파일 내용 그대로다.

---

### Task 1: 프로젝트 뼈대와 DB 스키마

**Files:**
- Create: `package.json`, `astro.config.mjs`, `wrangler.jsonc`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `AGENTS.md`
- Create: `migrations/0001_init.sql`, `src/pages/index.astro`(임시, 작업 7에서 바꿈)
- Test: `test/apply-migrations.ts`, `test/env.d.ts`, `test/db/schema.test.ts`

**Interfaces:**
- Produces: D1 바인딩 `DB`. 테이블 `profile`(id=1 기본 행, 이름 `이름을 입력하세요`), `works`, `files`, `login_attempts`. npm 스크립트 `dev`, `build`, `check`, `test`, `db:migrate:local`, `db:seed:local`, `smoke`. 테스트 환경에서 `env.DB`에 마이그레이션이 적용된 D1이 준비된다.

- [ ] **Step 1: 설정 파일을 만든다**

`package.json`
```json
{
  "name": "portfolio",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.23.4"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "types": "wrangler types",
    "check": "wrangler types && astro check",
    "test": "vitest run",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:seed:local": "wrangler d1 execute DB --local --file seed/dev.sql",
    "smoke": "node scripts/smoke.mjs"
  },
  "dependencies": {
    "@astrojs/cloudflare": "14.4.2",
    "astro": "7.4.2",
    "pretendard": "1.3.9"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.12",
    "@cloudflare/vitest-plugin": "1.4.9",
    "@types/node": "24.19.2",
    "typescript": "6.0.3",
    "vitest": "5.0.5",
    "wrangler": "4.154.0"
  }
}
```

`astro.config.mjs`
```js
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  session: false,
});
```

`wrangler.jsonc`: `database_id`는 일부러 적지 않는다. 로컬에서는 없어도 동작함을 확인했다. 원격 DB 연결은 4단계 배포 안내서에서 다룬다.
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "portfolio",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-10-01",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "portfolio",
      "migrations_dir": "migrations"
    }
  ]
}
```

`tsconfig.json`
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "worker-configuration.d.ts", "src/**/*", "test/**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "types": ["@cloudflare/vitest-plugin/types"]
  }
}
```

`vitest.config.ts`
```ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(path.resolve(import.meta.dirname, "migrations"));
      return {
        miniflare: {
          compatibilityDate: "2026-10-01",
          compatibilityFlags: ["nodejs_compat"],
          d1Databases: ["DB"],
          bindings: { TEST_MIGRATIONS: migrations },
        },
      };
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/apply-migrations.ts"],
  },
});
```

`.gitignore`
```gitignore
node_modules/
dist/
.astro/
.wrangler/
.dev.vars
worker-configuration.d.ts
```

`AGENTS.md`
```markdown
# AGENTS.md

개인 포트폴리오 사이트. Astro 7을 Cloudflare Workers에 올리고, 데이터는 D1에 둔다. 파일 저장소(R2)는 3단계에서 붙인다.

- 설계: `docs/superpowers/specs/2026-10-27-portfolio-site-design.md`
- 구현 계획: `docs/superpowers/plans/`
- 협업 규칙: `C:/Users/bhr46/.codex-collab/RULES.md`. 승인된 계획만 실행하고, 인계는 `collab/HANDOFF.md`에 쓴다.

## 명령

| 목적 | 명령 |
|---|---|
| 의존성 설치 | `npm install` |
| 로컬 DB 마이그레이션 | `npm run db:migrate:local` |
| 로컬 예시 데이터 넣기 | `npm run db:seed:local` |
| 개발 서버 | `npm run dev` |
| 단위·DB 테스트 | `npm test` |
| 타입 검사 | `npm run check` |
| 빌드 | `npm run build` |
| 화면 점검 | `npm run smoke` (마이그레이션과 예시 데이터를 먼저 넣는다) |

## 지킬 것

- Node.js 22.23.4 이상을 쓴다.
- npm 11은 의존성 설치 스크립트를 막고 `allow-scripts` 경고를 낸다. 그대로 둔다. `npm approve-scripts`는 실행하지 않는다.
- Cloudflare 바인딩은 `import { env } from "cloudflare:workers"`로 읽는다. `Astro.locals.runtime`은 없다.
- DB 함수는 `db: D1Database`를 인자로 받는다. 페이지에서 `env.DB`를 넘긴다.
- 테스트는 `@cloudflare/vitest-plugin`으로 Workers 런타임에서 돈다. 같은 파일 안의 테스트끼리 D1 데이터가 격리되지 않으므로, DB를 쓰는 테스트 파일은 `beforeEach`에서 `resetDb(env.DB)`를 부른다.
- Astro 7의 Rust 컴파일러는 잘못된 HTML 중첩을 고쳐 주지 않는다. `<p>` 안에 블록 요소를 넣지 않는다.
- 배포(`wrangler deploy`), 로그인(`wrangler login`), `--remote` 명령, `git push`는 하지 않는다.
```

- [ ] **Step 2: 의존성을 설치한다**

Run: `npm install`
Expected: `added ... packages`가 나오고 종료 코드 0. `npm warn allow-scripts` 경고(workerd, esbuild)는 정상이다. `npm approve-scripts`는 실행하지 않는다.

- [ ] **Step 3: 마이그레이션 테스트 환경과 실패하는 테스트를 만든다**

`test/apply-migrations.ts`
```ts
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
```

`test/env.d.ts`
```ts
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
```

`test/db/schema.test.ts`
```ts
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("0001_init 마이그레이션", () => {
  it("기본 자기소개 한 줄을 만든다", async () => {
    const { results } = await env.DB.prepare("SELECT id, name, links_json FROM profile").all();
    expect(results).toEqual([{ id: 1, name: "이름을 입력하세요", links_json: "[]" }]);
  });

  it("작품, 파일, 로그인 잠금 테이블을 만든다", async () => {
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('works', 'files', 'login_attempts') ORDER BY name",
    ).all<{ name: string }>();
    expect(results.map((row) => row.name)).toEqual(["files", "login_attempts", "works"]);
  });

  it("자기소개는 id 1 한 줄만 허용한다", async () => {
    await expect(
      env.DB.prepare("INSERT INTO profile (id, name, updated_at) VALUES (2, 'x', 'now')").run(),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 4: 테스트가 실패하는지 확인한다**

Run: `npm test`
Expected: FAIL. `migrations` 폴더가 없어서 `readD1Migrations` 또는 테이블 조회가 오류를 낸다.

- [ ] **Step 5: 첫 마이그레이션을 만든다**

`migrations/0001_init.sql`
```sql
CREATE TABLE profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  email TEXT,
  github_url TEXT,
  links_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

INSERT INTO profile (id, name, updated_at)
VALUES (1, '이름을 입력하세요', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TABLE works (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  description_html TEXT NOT NULL,
  fields_json TEXT NOT NULL DEFAULT '[]',
  techs_json TEXT NOT NULL DEFAULT '[]',
  links_json TEXT NOT NULL DEFAULT '[]',
  competition TEXT,
  organizer TEXT,
  participated_on TEXT,
  period_start TEXT,
  period_end TEXT,
  award TEXT,
  team_type TEXT CHECK (team_type IN ('solo', 'team')),
  team_size INTEGER,
  role TEXT,
  is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX works_public_idx ON works (is_public);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  work_id TEXT REFERENCES works (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('cover', 'gallery', 'attachment', 'avatar')),
  r2_key TEXT NOT NULL,
  thumb_r2_key TEXT,
  original_name TEXT NOT NULL,
  relative_path TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'complete')),
  upload_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX files_work_idx ON files (work_id, kind, sort_order);

CREATE TABLE login_attempts (
  ip TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run: `npm test`
Expected: `Test Files  1 passed (1)`, `Tests  3 passed (3)`

- [ ] **Step 7: 임시 홈 페이지를 만들고 타입 검사와 빌드를 확인한다**

`src/pages/index.astro`(임시)
```astro
---
---

<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>준비 중</title>
  </head>
  <body>
    <p>준비 중</p>
  </body>
</html>
```

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: 마지막 줄 `Complete!`

- [ ] **Step 8: 로컬 D1에 마이그레이션을 적용한다**

Run: `npm run db:migrate:local`
Expected: 표에 `0001_init.sql │ ✅`. `.wrangler/state`에 로컬 DB가 생긴다(Git에서 제외됨).

- [ ] **Step 9: 커밋한다**

```bash
git add package.json package-lock.json astro.config.mjs wrangler.jsonc tsconfig.json vitest.config.ts .gitignore AGENTS.md migrations/0001_init.sql src/pages/index.astro test/apply-migrations.ts test/env.d.ts test/db/schema.test.ts
git commit -m "chore: scaffold Astro on Cloudflare Workers with D1 schema"
```

---

### Task 2: 도메인 타입과 DB 행 변환

**Files:**
- Create: `src/lib/types.ts`, `src/lib/db/rows.ts`
- Test: `test/helpers/factories.ts`, `test/db/rows.test.ts`

**Interfaces:**
- Produces: `src/lib/types.ts`의 `Work`, `WorkLink`, `LinkKind`, `LINK_KINDS`, `LINK_KIND_LABELS`, `TeamType`, `Profile`, `ProfileLink`, `WorkFilters`
- Produces: `src/lib/db/rows.ts`의 `WorkRow`, `ProfileRow`, `rowToWork(row: WorkRow): Work`, `rowToProfile(row: ProfileRow): Profile`, `isHttpUrl(value: unknown): value is string`
- Produces: `test/helpers/factories.ts`의 `makeWorkRow(overrides?: Partial<WorkRow>): WorkRow`, `makeWork(overrides?: Partial<Work>): Work`
- 규칙: 빈 문자열은 `null`이 된다. 깨진 JSON은 `[]`가 된다. 링크는 종류가 `github|demo|video|other`이고 `label`이 문자열이며 주소가 http/https일 때만 남는다. 개인 작품의 인원 수는 `null`이다.

- [ ] **Step 1: 테스트 도우미와 실패하는 테스트를 만든다**

`test/helpers/factories.ts`
```ts
import type { WorkRow } from "../../src/lib/db/rows";
import type { Work } from "../../src/lib/types";

let sequence = 0;

export function makeWorkRow(overrides: Partial<WorkRow> = {}): WorkRow {
  sequence += 1;
  return {
    id: `w-${sequence}`,
    slug: `work-${sequence}`,
    title: `작품 ${sequence}`,
    summary: null,
    description_html: "<p>설명</p>",
    fields_json: '["개발"]',
    techs_json: "[]",
    links_json: "[]",
    competition: null,
    organizer: null,
    participated_on: null,
    period_start: null,
    period_end: null,
    award: null,
    team_type: null,
    team_size: null,
    role: null,
    is_public: 1,
    is_featured: 0,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeWork(overrides: Partial<Work> = {}): Work {
  sequence += 1;
  return {
    id: `w-${sequence}`,
    slug: `work-${sequence}`,
    title: `작품 ${sequence}`,
    summary: null,
    descriptionHtml: "<p>설명</p>",
    fields: ["개발"],
    techs: [],
    links: [],
    competition: null,
    organizer: null,
    participatedOn: null,
    periodStart: null,
    periodEnd: null,
    award: null,
    teamType: null,
    teamSize: null,
    role: null,
    isPublic: true,
    isFeatured: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}
```

`test/db/rows.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { rowToProfile, rowToWork } from "../../src/lib/db/rows";
import { makeWorkRow } from "../helpers/factories";

describe("rowToWork", () => {
  it("열 이름과 0/1 값을 작품 객체로 바꾼다", () => {
    const work = rowToWork(
      makeWorkRow({
        id: "a",
        slug: "한글-작품",
        title: "한글 작품",
        summary: "요약",
        fields_json: '["개발","디자인"]',
        techs_json: '["Astro"]',
        links_json: '[{"kind":"github","label":"코드","url":"https://github.com/x/y"}]',
        participated_on: "2025-08-23",
        team_type: "team",
        team_size: 4,
        is_public: 1,
        is_featured: 1,
      }),
    );
    expect(work).toMatchObject({
      id: "a",
      slug: "한글-작품",
      title: "한글 작품",
      summary: "요약",
      fields: ["개발", "디자인"],
      techs: ["Astro"],
      links: [{ kind: "github", label: "코드", url: "https://github.com/x/y" }],
      participatedOn: "2025-08-23",
      teamType: "team",
      teamSize: 4,
      isPublic: true,
      isFeatured: true,
    });
  });

  it("깨진 JSON은 빈 목록으로 바꾼다", () => {
    const work = rowToWork(makeWorkRow({ fields_json: "{oops", techs_json: '"text"', links_json: "null" }));
    expect(work.fields).toEqual([]);
    expect(work.techs).toEqual([]);
    expect(work.links).toEqual([]);
  });

  it("규칙에 맞지 않는 링크와 빈 태그를 버린다", () => {
    const work = rowToWork(
      makeWorkRow({
        fields_json: '["개발", "  ", 3]',
        links_json: JSON.stringify([
          { kind: "github", label: "ok", url: "https://example.com" },
          { kind: "unknown", label: "x", url: "https://example.com" },
          { kind: "demo", label: "x", url: "javascript:alert(1)" },
          { kind: "video", url: "https://youtu.be/aqz-KE-bpKQ" },
        ]),
      }),
    );
    expect(work.fields).toEqual(["개발"]);
    expect(work.links).toEqual([{ kind: "github", label: "ok", url: "https://example.com" }]);
  });

  it("빈 문자열은 null로, 개인 작품의 인원 수는 null로 둔다", () => {
    const work = rowToWork(
      makeWorkRow({ award: "  ", competition: "", team_type: "solo", team_size: 3, is_public: 0 }),
    );
    expect(work.award).toBeNull();
    expect(work.competition).toBeNull();
    expect(work.teamType).toBe("solo");
    expect(work.teamSize).toBeNull();
    expect(work.isPublic).toBe(false);
  });
});

describe("rowToProfile", () => {
  it("링크를 읽고 잘못된 주소와 빈 값을 버린다", () => {
    const profile = rowToProfile({
      id: 1,
      name: "홍길동",
      headline: "",
      bio: "소개",
      email: "a@b.c",
      github_url: "not a url",
      links_json: '[{"label":"블로그","url":"https://example.com"},{"label":"x","url":"ftp://x"},{"label":" ","url":"https://y.com"}]',
      updated_at: "2025-01-01T00:00:00.000Z",
    });
    expect(profile).toEqual({
      name: "홍길동",
      headline: null,
      bio: "소개",
      email: "a@b.c",
      githubUrl: null,
      links: [{ label: "블로그", url: "https://example.com" }],
      updatedAt: "2025-01-01T00:00:00.000Z",
    });
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/db/rows.test.ts`
Expected: FAIL. `src/lib/db/rows`를 불러오지 못한다.

- [ ] **Step 3: 타입과 변환 함수를 만든다**

`src/lib/types.ts`
```ts
export const LINK_KINDS = ["github", "demo", "video", "other"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  github: "GitHub",
  demo: "데모",
  video: "영상",
  other: "링크",
};

export interface WorkLink {
  kind: LinkKind;
  label: string;
  url: string;
}

export type TeamType = "solo" | "team";

export interface Work {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  descriptionHtml: string;
  fields: string[];
  techs: string[];
  links: WorkLink[];
  competition: string | null;
  organizer: string | null;
  participatedOn: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  award: string | null;
  teamType: TeamType | null;
  teamSize: number | null;
  role: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  githubUrl: string | null;
  links: ProfileLink[];
  updatedAt: string;
}

export interface WorkFilters {
  field: string | null;
  year: number | null;
  award: boolean;
}
```

`src/lib/db/rows.ts`
```ts
import { LINK_KINDS, type LinkKind, type Profile, type ProfileLink, type TeamType, type Work, type WorkLink } from "../types";

export interface WorkRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description_html: string;
  fields_json: string;
  techs_json: string;
  links_json: string;
  competition: string | null;
  organizer: string | null;
  participated_on: string | null;
  period_start: string | null;
  period_end: string | null;
  award: string | null;
  team_type: string | null;
  team_size: number | null;
  role: string | null;
  is_public: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: number;
  name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  github_url: string | null;
  links_json: string;
  updated_at: string;
}

function parseJsonArray(text: string | null): unknown[] {
  if (!text) return [];
  try {
    const value: unknown = JSON.parse(text);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function emptyToNull(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toStringList(text: string | null): string[] {
  return parseJsonArray(text)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function toWorkLinks(text: string | null): WorkLink[] {
  const links: WorkLink[] = [];
  for (const item of parseJsonArray(text)) {
    if (typeof item !== "object" || item === null) continue;
    const { kind, label, url } = item as Record<string, unknown>;
    if (!LINK_KINDS.includes(kind as LinkKind)) continue;
    if (typeof label !== "string" || !isHttpUrl(url)) continue;
    links.push({ kind: kind as LinkKind, label: label.trim(), url });
  }
  return links;
}

function toProfileLinks(text: string | null): ProfileLink[] {
  const links: ProfileLink[] = [];
  for (const item of parseJsonArray(text)) {
    if (typeof item !== "object" || item === null) continue;
    const { label, url } = item as Record<string, unknown>;
    if (typeof label !== "string" || label.trim() === "" || !isHttpUrl(url)) continue;
    links.push({ label: label.trim(), url });
  }
  return links;
}

export function rowToWork(row: WorkRow): Work {
  const teamType: TeamType | null = row.team_type === "solo" || row.team_type === "team" ? row.team_type : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: emptyToNull(row.summary),
    descriptionHtml: row.description_html,
    fields: toStringList(row.fields_json),
    techs: toStringList(row.techs_json),
    links: toWorkLinks(row.links_json),
    competition: emptyToNull(row.competition),
    organizer: emptyToNull(row.organizer),
    participatedOn: emptyToNull(row.participated_on),
    periodStart: emptyToNull(row.period_start),
    periodEnd: emptyToNull(row.period_end),
    award: emptyToNull(row.award),
    teamType,
    teamSize: teamType === "team" ? row.team_size : null,
    role: emptyToNull(row.role),
    isPublic: row.is_public === 1,
    isFeatured: row.is_featured === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToProfile(row: ProfileRow): Profile {
  const email = emptyToNull(row.email);
  return {
    name: row.name,
    headline: emptyToNull(row.headline),
    bio: emptyToNull(row.bio),
    email: email !== null && email.includes("@") ? email : null,
    githubUrl: isHttpUrl(row.github_url) ? row.github_url : null,
    links: toProfileLinks(row.links_json),
    updatedAt: row.updated_at,
  };
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/db/rows.test.ts`
Expected: `Tests  5 passed (5)`

- [ ] **Step 5: 커밋한다**

```bash
git add src/lib/types.ts src/lib/db/rows.ts test/helpers/factories.ts test/db/rows.test.ts
git commit -m "feat: add work and profile types with row mapping"
```

---

### Task 3: 정렬과 걸러 보기 규칙

**Files:**
- Create: `src/lib/works/sort.ts`, `src/lib/works/filter.ts`
- Test: `test/lib/sort.test.ts`, `test/lib/filter.test.ts`

**Interfaces:**
- Consumes: `Work`, `WorkFilters`(작업 2), `makeWork`(작업 2)
- Produces: `sortDateOf(work): string`, `yearOf(work): number`, `compareWorks(a, b): number`, `sortWorks(works): Work[]`
- Produces: `parseFilters(params: URLSearchParams): WorkFilters`, `hasActiveFilters(filters): boolean`, `isAwarded(work): boolean`, `applyFilters(works, filters): Work[]`, `filterOptions(works): { fields: string[]; years: number[] }`, `emptyStateMessage(totalPublic: number, filters): string`
- 문구: 공개 작품이 없으면 `아직 공개된 작품이 없어요.`, 조건 때문에 비었으면 `조건에 맞는 작품이 없어요.`

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/lib/sort.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { sortDateOf, sortWorks, yearOf } from "../../src/lib/works/sort";
import { makeWork } from "../helpers/factories";

describe("sortDateOf", () => {
  it("참가일을 먼저 쓴다", () => {
    expect(sortDateOf(makeWork({ participatedOn: "2025-08-23", periodStart: "2025-07-01" }))).toBe("2025-08-23");
  });

  it("참가일이 없으면 작업 시작일을 쓴다", () => {
    expect(sortDateOf(makeWork({ periodStart: "2025-07-01" }))).toBe("2025-07-01");
  });

  it("둘 다 없으면 등록일의 날짜 부분을 쓴다", () => {
    expect(sortDateOf(makeWork({ createdAt: "2023-05-01T09:00:00.000Z" }))).toBe("2023-05-01");
  });
});

describe("yearOf", () => {
  it("정렬 날짜의 연도를 돌려준다", () => {
    expect(yearOf(makeWork({ periodStart: "2024-09-01" }))).toBe(2024);
  });
});

describe("sortWorks", () => {
  it("정렬 날짜 최신순, 같으면 등록일 최신순", () => {
    const a = makeWork({ slug: "a", participatedOn: "2024-01-01" });
    const b = makeWork({ slug: "b", participatedOn: "2025-01-01", createdAt: "2025-01-02T00:00:00.000Z" });
    const c = makeWork({ slug: "c", participatedOn: "2025-01-01", createdAt: "2025-03-01T00:00:00.000Z" });
    expect(sortWorks([a, b, c]).map((work) => work.slug)).toEqual(["c", "b", "a"]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const works = [makeWork({ slug: "a", participatedOn: "2024-01-01" }), makeWork({ slug: "b", participatedOn: "2025-01-01" })];
    sortWorks(works);
    expect(works.map((work) => work.slug)).toEqual(["a", "b"]);
  });
});
```

`test/lib/filter.test.ts`
```ts
import { describe, expect, it } from "vitest";
import type { Work } from "../../src/lib/types";
import {
  applyFilters,
  emptyStateMessage,
  filterOptions,
  hasActiveFilters,
  parseFilters,
} from "../../src/lib/works/filter";
import { makeWork } from "../helpers/factories";

const NO_FILTERS = { field: null, year: null, award: false };
const slugs = (works: Work[]) => works.map((work) => work.slug);

describe("parseFilters", () => {
  it("한글 분야, 연도, 수상 조건을 읽는다", () => {
    expect(parseFilters(new URLSearchParams("field=%EB%94%94%EC%9E%90%EC%9D%B8&year=2025&award=1"))).toEqual({
      field: "디자인",
      year: 2025,
      award: true,
    });
  });

  it("잘못된 값은 무시한다", () => {
    expect(parseFilters(new URLSearchParams("field=%20%20&year=abcd&award=true"))).toEqual(NO_FILTERS);
    expect(parseFilters(new URLSearchParams("year=20255")).year).toBeNull();
    expect(parseFilters(new URLSearchParams(""))).toEqual(NO_FILTERS);
  });
});

describe("applyFilters", () => {
  const dev = makeWork({ slug: "dev", fields: ["개발"], participatedOn: "2025-03-01", award: "대상" });
  const design = makeWork({ slug: "design", fields: ["디자인", "기획"], participatedOn: "2024-05-01" });
  const both = makeWork({ slug: "both", fields: ["개발", "기획"], periodStart: "2024-10-01", award: "  " });
  const all = [dev, design, both];

  it("조건이 없으면 그대로 돌려준다", () => {
    expect(slugs(applyFilters(all, NO_FILTERS))).toEqual(["dev", "design", "both"]);
  });

  it("분야로 거른다", () => {
    expect(slugs(applyFilters(all, { ...NO_FILTERS, field: "기획" }))).toEqual(["design", "both"]);
  });

  it("연도로 거른다", () => {
    expect(slugs(applyFilters(all, { ...NO_FILTERS, year: 2024 }))).toEqual(["design", "both"]);
  });

  it("수상작만 남긴다 (공백뿐인 수상은 제외)", () => {
    expect(slugs(applyFilters(all, { ...NO_FILTERS, award: true }))).toEqual(["dev"]);
  });

  it("조건을 함께 적용한다", () => {
    expect(slugs(applyFilters(all, { field: "개발", year: 2024, award: false }))).toEqual(["both"]);
  });

  it("선택지는 분야 가나다순, 연도 최신순으로 중복 없이 만든다", () => {
    expect(filterOptions(all)).toEqual({ fields: ["개발", "기획", "디자인"], years: [2025, 2024] });
  });
});

describe("hasActiveFilters", () => {
  it("하나라도 있으면 true", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, award: true })).toBe(true);
  });
});

describe("emptyStateMessage", () => {
  it("공개 작품이 없을 때와 조건 때문에 비었을 때를 구분한다", () => {
    expect(emptyStateMessage(0, { ...NO_FILTERS, field: "개발" })).toBe("아직 공개된 작품이 없어요.");
    expect(emptyStateMessage(3, { ...NO_FILTERS, field: "개발" })).toBe("조건에 맞는 작품이 없어요.");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/lib/sort.test.ts test/lib/filter.test.ts`
Expected: FAIL. `src/lib/works/sort`와 `src/lib/works/filter`를 불러오지 못한다.

- [ ] **Step 3: 규칙을 만든다**

`src/lib/works/sort.ts`
```ts
import type { Work } from "../types";

type Dated = Pick<Work, "participatedOn" | "periodStart" | "createdAt">;

export function sortDateOf(work: Dated): string {
  return work.participatedOn ?? work.periodStart ?? work.createdAt.slice(0, 10);
}

export function yearOf(work: Dated): number {
  return Number(sortDateOf(work).slice(0, 4));
}

function descending(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? 1 : -1;
}

export function compareWorks(a: Work, b: Work): number {
  return descending(sortDateOf(a), sortDateOf(b)) || descending(a.createdAt, b.createdAt);
}

export function sortWorks(works: readonly Work[]): Work[] {
  return [...works].sort(compareWorks);
}
```

`src/lib/works/filter.ts`
```ts
import type { Work, WorkFilters } from "../types";
import { yearOf } from "./sort";

export function parseFilters(params: URLSearchParams): WorkFilters {
  const field = params.get("field")?.trim() ?? "";
  const year = params.get("year")?.trim() ?? "";
  return {
    field: field === "" ? null : field,
    year: /^\d{4}$/.test(year) ? Number(year) : null,
    award: params.get("award") === "1",
  };
}

export function hasActiveFilters(filters: WorkFilters): boolean {
  return filters.field !== null || filters.year !== null || filters.award;
}

export function isAwarded(work: Pick<Work, "award">): boolean {
  return work.award !== null && work.award.trim() !== "";
}

export function applyFilters(works: readonly Work[], filters: WorkFilters): Work[] {
  return works.filter(
    (work) =>
      (filters.field === null || work.fields.includes(filters.field)) &&
      (filters.year === null || yearOf(work) === filters.year) &&
      (!filters.award || isAwarded(work)),
  );
}

export function filterOptions(works: readonly Work[]): { fields: string[]; years: number[] } {
  const fields = [...new Set(works.flatMap((work) => work.fields))].sort((a, b) => a.localeCompare(b, "ko"));
  const years = [...new Set(works.map(yearOf))].sort((a, b) => b - a);
  return { fields, years };
}

export function emptyStateMessage(totalPublic: number, filters: WorkFilters): string {
  return totalPublic > 0 && hasActiveFilters(filters) ? "조건에 맞는 작품이 없어요." : "아직 공개된 작품이 없어요.";
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/lib/sort.test.ts test/lib/filter.test.ts`
Expected: `Tests  16 passed (16)`

- [ ] **Step 5: 커밋한다**

```bash
git add src/lib/works/sort.ts src/lib/works/filter.ts test/lib/sort.test.ts test/lib/filter.test.ts
git commit -m "feat: add sort-date ordering and work filters"
```

---

### Task 4: 표시용 도우미(요약, 유튜브, 분야 색, 날짜·팀 표기)

**Files:**
- Create: `src/lib/works/summary.ts`, `src/lib/works/youtube.ts`, `src/lib/works/fieldColor.ts`, `src/lib/format.ts`
- Test: `test/lib/summary.test.ts`, `test/lib/youtube.test.ts`, `test/lib/fieldColor.test.ts`, `test/lib/format.test.ts`

**Interfaces:**
- Produces: `SUMMARY_MAX = 120`, `stripHtml(html: string): string`, `summaryOf(work: Pick<Work, "summary" | "descriptionHtml">): string`
- Produces: `youtubeEmbedUrl(raw: string): string | null`
- Produces: `FieldColor { bg; fg }`, `FIELD_PALETTE`(6색), `fieldColor(field: string | undefined): FieldColor`. djb2 해시(시작값 5381)를 6으로 나눈 나머지로 고른다.
- Produces: `formatDate(isoDate: string): string`(`2025.08.23`), `formatPeriod(start, end): string | null`(구분자는 `–` U+2013), `teamLabel(type, size): string | null`

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/lib/summary.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { stripHtml, summaryOf } from "../../src/lib/works/summary";

describe("stripHtml", () => {
  it("문단 사이는 띄우고 글자 안의 태그는 붙인다", () => {
    expect(stripHtml("<p>매일 할 일을 <strong>세 가지</strong>만</p><p>둘째</p>")).toBe("매일 할 일을 세 가지만 둘째");
  });

  it("script와 style 내용은 지우고 엔티티를 푼다", () => {
    expect(stripHtml("<style>p{}</style><p>A &amp; B &lt;C&gt;</p><script>alert(1)</script>")).toBe("A & B <C>");
  });
});

describe("summaryOf", () => {
  it("한 줄 요약이 있으면 그대로 쓴다", () => {
    expect(summaryOf({ summary: "  요약  ", descriptionHtml: "<p>설명</p>" })).toBe("요약");
  });

  it("없으면 설명의 앞 120자를 쓴다", () => {
    const text = "가".repeat(130);
    expect(summaryOf({ summary: null, descriptionHtml: `<p>${text}</p>` })).toBe("가".repeat(120));
  });

  it("이모지를 반으로 자르지 않는다", () => {
    const result = summaryOf({ summary: null, descriptionHtml: "😀".repeat(130) });
    expect(Array.from(result)).toHaveLength(120);
    expect(result).toBe("😀".repeat(120));
  });
});
```

`test/lib/youtube.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { youtubeEmbedUrl } from "../../src/lib/works/youtube";

const EMBED = "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ";

describe("youtubeEmbedUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtube.com/watch?v=aqz-KE-bpKQ&t=42s",
    "https://m.youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtu.be/aqz-KE-bpKQ?si=abc",
    "https://www.youtube.com/shorts/aqz-KE-bpKQ",
  ])("%s 는 퍼가기 주소가 된다", (url) => {
    expect(youtubeEmbedUrl(url)).toBe(EMBED);
  });

  it.each([
    "https://vimeo.com/123",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/channel/abc",
    "javascript:alert(1)",
    "유튜브",
  ])("%s 는 null", (url) => {
    expect(youtubeEmbedUrl(url)).toBeNull();
  });
});
```

`test/lib/fieldColor.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { FIELD_PALETTE, fieldColor } from "../../src/lib/works/fieldColor";

describe("fieldColor", () => {
  it("6색 팔레트에서 분야 이름으로 정해진 색을 고른다", () => {
    expect(FIELD_PALETTE).toHaveLength(6);
    expect(fieldColor("개발")).toBe(FIELD_PALETTE[3]);
    expect(fieldColor("디자인")).toBe(FIELD_PALETTE[1]);
    expect(fieldColor("기획")).toBe(FIELD_PALETTE[4]);
    expect(fieldColor("데이터")).toBe(FIELD_PALETTE[5]);
  });

  it("같은 분야는 항상 같은 색이다", () => {
    expect(fieldColor("개발")).toBe(fieldColor("개발"));
  });

  it("분야가 없으면 첫 번째 색이다", () => {
    expect(fieldColor(undefined)).toBe(FIELD_PALETTE[0]);
    expect(fieldColor("")).toBe(FIELD_PALETTE[0]);
  });
});
```

`test/lib/format.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { formatDate, formatPeriod, teamLabel } from "../../src/lib/format";

describe("formatDate", () => {
  it("날짜를 점으로 구분한다", () => {
    expect(formatDate("2025-08-23")).toBe("2025.08.23");
    expect(formatDate("2025-08-23T10:00:00.000Z")).toBe("2025.08.23");
  });
});

describe("formatPeriod", () => {
  it("있는 날짜만으로 기간을 만든다", () => {
    expect(formatPeriod("2024-09-01", "2024-11-30")).toBe("2024.09.01 – 2024.11.30");
    expect(formatPeriod("2024-09-01", null)).toBe("2024.09.01 –");
    expect(formatPeriod(null, "2024-11-30")).toBe("– 2024.11.30");
    expect(formatPeriod(null, null)).toBeNull();
  });
});

describe("teamLabel", () => {
  it("개인과 팀(인원 수)을 표시한다", () => {
    expect(teamLabel("solo", null)).toBe("개인");
    expect(teamLabel("team", 4)).toBe("팀 (4명)");
    expect(teamLabel("team", null)).toBe("팀");
    expect(teamLabel(null, 3)).toBeNull();
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/lib/summary.test.ts test/lib/youtube.test.ts test/lib/fieldColor.test.ts test/lib/format.test.ts`
Expected: FAIL. 네 모듈을 불러오지 못한다.

- [ ] **Step 3: 도우미를 만든다**

`src/lib/works/summary.ts`
```ts
import type { Work } from "../types";

export const SUMMARY_MAX = 120;

const SCRIPT_OR_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const BLOCK_TAG = /<\/?(?:p|div|br|hr|li|ul|ol|h[1-6]|blockquote|pre|section|article|table|tr|td|th)\b[^>]*>/gi;
const ANY_TAG = /<[^>]*>/g;
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

export function stripHtml(html: string): string {
  return html
    .replace(SCRIPT_OR_STYLE, " ")
    .replace(BLOCK_TAG, " ")
    .replace(ANY_TAG, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

export function summaryOf(work: Pick<Work, "summary" | "descriptionHtml">): string {
  const summary = work.summary?.trim() ?? "";
  if (summary !== "") return summary;
  return Array.from(stripHtml(work.descriptionHtml)).slice(0, SUMMARY_MAX).join("");
}
```

`src/lib/works/youtube.ts`
```ts
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

export function youtubeEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  let id: string | null = null;
  if (url.hostname === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] ?? null;
  }

  return id !== null && VIDEO_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
```

`src/lib/works/fieldColor.ts`
```ts
export interface FieldColor {
  bg: string;
  fg: string;
}

export const FIELD_PALETTE: readonly FieldColor[] = [
  { bg: "#E9EEFF", fg: "#2741B0" },
  { bg: "#E6F6EE", fg: "#17663F" },
  { bg: "#FFF1E3", fg: "#9A4A0B" },
  { bg: "#F5E9FF", fg: "#6B2BA8" },
  { bg: "#E5F5F8", fg: "#126574" },
  { bg: "#FDE9EE", fg: "#A3244A" },
];

export function fieldColor(field: string | undefined): FieldColor {
  if (!field) return FIELD_PALETTE[0]!;
  let hash = 5381;
  for (const char of field) {
    hash = ((hash << 5) + hash + char.codePointAt(0)!) >>> 0;
  }
  return FIELD_PALETTE[hash % FIELD_PALETTE.length]!;
}
```

`src/lib/format.ts`
```ts
import type { TeamType } from "./types";

export function formatDate(isoDate: string): string {
  return isoDate.slice(0, 10).replaceAll("-", ".");
}

export function formatPeriod(start: string | null, end: string | null): string | null {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `${formatDate(start)} –`;
  if (end) return `– ${formatDate(end)}`;
  return null;
}

export function teamLabel(type: TeamType | null, size: number | null): string | null {
  if (type === "solo") return "개인";
  if (type === "team") return size !== null && size >= 2 ? `팀 (${size}명)` : "팀";
  return null;
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/lib/summary.test.ts test/lib/youtube.test.ts test/lib/fieldColor.test.ts test/lib/format.test.ts`
Expected: `Tests  21 passed (21)`

- [ ] **Step 5: 커밋한다**

```bash
git add src/lib/works/summary.ts src/lib/works/youtube.ts src/lib/works/fieldColor.ts src/lib/format.ts test/lib/summary.test.ts test/lib/youtube.test.ts test/lib/fieldColor.test.ts test/lib/format.test.ts
git commit -m "feat: add summary, youtube embed, field color and format helpers"
```

---

### Task 5: DB 조회 함수

**Files:**
- Create: `src/lib/db/works.ts`, `src/lib/db/profile.ts`
- Test: `test/helpers/db.ts`, `test/db/works.test.ts`, `test/db/profile.test.ts`

**Interfaces:**
- Consumes: `rowToWork`, `rowToProfile`, `WorkRow`, `ProfileRow`(작업 2), `sortWorks`(작업 3)
- Produces: `listPublicWorks(db: D1Database): Promise<Work[]>`(공개만, 정렬됨), `getPublicWorkBySlug(db: D1Database, slug: string): Promise<Work | null>`
- Produces: `DEFAULT_PROFILE_NAME = "이름을 입력하세요"`, `getProfile(db: D1Database): Promise<Profile>`
- Produces(테스트용): `resetDb(db): Promise<void>`, `insertWorkRow(db, row: WorkRow): Promise<void>`

- [ ] **Step 1: 테스트 도우미와 실패하는 테스트를 만든다**

`test/helpers/db.ts`
```ts
import type { WorkRow } from "../../src/lib/db/rows";

export async function resetDb(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM files"),
    db.prepare("DELETE FROM works"),
    db.prepare("DELETE FROM login_attempts"),
    db.prepare(
      "UPDATE profile SET name = '이름을 입력하세요', headline = NULL, bio = NULL, email = NULL, github_url = NULL, links_json = '[]' WHERE id = 1",
    ),
  ]);
}

export async function insertWorkRow(db: D1Database, row: WorkRow): Promise<void> {
  const columns = Object.keys(row) as (keyof WorkRow)[];
  const placeholders = columns.map(() => "?").join(", ");
  await db
    .prepare(`INSERT INTO works (${columns.join(", ")}) VALUES (${placeholders})`)
    .bind(...columns.map((column) => row[column]))
    .run();
}
```

`test/db/works.test.ts`
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { getPublicWorkBySlug, listPublicWorks } from "../../src/lib/db/works";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";

beforeEach(async () => {
  await resetDb(env.DB);
});

describe("listPublicWorks", () => {
  it("공개 작품만 정렬 날짜 최신순으로 돌려준다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ slug: "old", participated_on: "2024-01-01" }));
    await insertWorkRow(env.DB, makeWorkRow({ slug: "hidden", participated_on: "2026-01-01", is_public: 0 }));
    await insertWorkRow(env.DB, makeWorkRow({ slug: "new", participated_on: "2025-05-05" }));
    const works = await listPublicWorks(env.DB);
    expect(works.map((work) => work.slug)).toEqual(["new", "old"]);
  });

  it("공개 작품이 없으면 빈 목록", async () => {
    expect(await listPublicWorks(env.DB)).toEqual([]);
  });
});

describe("getPublicWorkBySlug", () => {
  it("한글 slug로 공개 작품을 찾는다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ slug: "한글-작품", title: "한글 작품" }));
    const work = await getPublicWorkBySlug(env.DB, "한글-작품");
    expect(work?.title).toBe("한글 작품");
  });

  it("비공개이거나 없는 slug면 null", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ slug: "secret", is_public: 0 }));
    expect(await getPublicWorkBySlug(env.DB, "secret")).toBeNull();
    expect(await getPublicWorkBySlug(env.DB, "none")).toBeNull();
  });
});
```

`test/db/profile.test.ts`
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PROFILE_NAME, getProfile } from "../../src/lib/db/profile";
import { resetDb } from "../helpers/db";

beforeEach(async () => {
  await resetDb(env.DB);
});

describe("getProfile", () => {
  it("처음에는 기본 이름을 돌려준다", async () => {
    const profile = await getProfile(env.DB);
    expect(profile.name).toBe(DEFAULT_PROFILE_NAME);
    expect(profile.links).toEqual([]);
  });

  it("저장된 자기소개와 링크를 읽는다", async () => {
    await env.DB.prepare(
      "UPDATE profile SET name = ?, headline = ?, links_json = ? WHERE id = 1",
    )
      .bind("홍길동", "개발자", '[{"label":"블로그","url":"https://example.com"}]')
      .run();
    const profile = await getProfile(env.DB);
    expect(profile).toMatchObject({
      name: "홍길동",
      headline: "개발자",
      links: [{ label: "블로그", url: "https://example.com" }],
    });
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/db/works.test.ts test/db/profile.test.ts`
Expected: FAIL. `src/lib/db/works`와 `src/lib/db/profile`을 불러오지 못한다.

- [ ] **Step 3: 조회 함수를 만든다**

`src/lib/db/works.ts`
```ts
import type { Work } from "../types";
import { sortWorks } from "../works/sort";
import { rowToWork, type WorkRow } from "./rows";

export async function listPublicWorks(db: D1Database): Promise<Work[]> {
  const { results } = await db.prepare("SELECT * FROM works WHERE is_public = 1").all<WorkRow>();
  return sortWorks(results.map(rowToWork));
}

export async function getPublicWorkBySlug(db: D1Database, slug: string): Promise<Work | null> {
  const row = await db.prepare("SELECT * FROM works WHERE slug = ? AND is_public = 1").bind(slug).first<WorkRow>();
  return row ? rowToWork(row) : null;
}
```

`src/lib/db/profile.ts`
```ts
import type { Profile } from "../types";
import { rowToProfile, type ProfileRow } from "./rows";

export const DEFAULT_PROFILE_NAME = "이름을 입력하세요";

export async function getProfile(db: D1Database): Promise<Profile> {
  const row = await db.prepare("SELECT * FROM profile WHERE id = 1").first<ProfileRow>();
  if (row) return rowToProfile(row);
  return {
    name: DEFAULT_PROFILE_NAME,
    headline: null,
    bio: null,
    email: null,
    githubUrl: null,
    links: [],
    updatedAt: new Date(0).toISOString(),
  };
}
```

- [ ] **Step 4: 전체 테스트가 통과하는지 확인한다**

Run: `npm test`
Expected: `Test Files  10 passed (10)`, `Tests  51 passed (51)`

- [ ] **Step 5: 커밋한다**

```bash
git add src/lib/db/works.ts src/lib/db/profile.ts test/helpers/db.ts test/db/works.test.ts test/db/profile.test.ts
git commit -m "feat: add D1 queries for public works and profile"
```

---

### Task 6: 레이아웃, 디자인 토큰, 404·500 페이지

**Files:**
- Create: `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/pages/404.astro`, `src/pages/500.astro`, `public/favicon.svg`

**Interfaces:**
- Produces: `BaseLayout` props `{ title: string; description: string; image?: string | null; noindex?: boolean; ownerName?: string | null }`. Pretendard 글꼴과 전역 CSS를 불러오고, 제목·설명·OG 태그를 넣는다. `ownerName`이 있으면 바닥글 `© {연도} {이름}`을 보여준다.
- Produces: 전역 클래스 `.container`, `.tags`, `.tag`, `.badge-award`, `.btn`, `.btn-primary`, `.visually-hidden`, `.site-footer`. CSS 변수 `--bg`, `--surface`, `--ink`, `--body`, `--muted`, `--line`, `--accent`, `--award`, `--award-soft`, `--radius`, `--radius-sm`, `--maxw`, `--font`
- 404 제목 `페이지를 찾을 수 없어요`, 500 제목 `문제가 생겼어요`. 둘 다 `noindex`

- [ ] **Step 1: 전역 스타일을 만든다**

`src/styles/global.css`
```css
:root {
  --bg: #ffffff;
  --surface: #f5f6f8;
  --ink: #111418;
  --body: #3a404a;
  --muted: #6b7280;
  --line: #e6e8ec;
  --accent: #3354e0;
  --award: #a4520a;
  --award-soft: #fff4e5;
  --radius: 16px;
  --radius-sm: 10px;
  --maxw: 1120px;
  --font: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo",
    "Malgun Gothic", sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--body);
  font-family: var(--font);
  font-size: 16px;
  line-height: 1.7;
  word-break: keep-all;
  overflow-wrap: anywhere;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--ink);
  line-height: 1.3;
  letter-spacing: -0.02em;
}

p {
  margin: 0;
}

a {
  color: inherit;
}

img {
  display: block;
  max-width: 100%;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}

.container {
  width: 100%;
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 20px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--body);
  font-size: 13px;
  font-weight: 600;
}

.badge-award {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--award-soft);
  color: var(--award);
  font-size: 13px;
  font-weight: 700;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn:hover {
  border-color: var(--ink);
}

.btn-primary {
  border-color: var(--ink);
  background: var(--ink);
  color: #fff;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.site-footer {
  margin-top: 96px;
  padding: 32px 0 48px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 14px;
}
```

- [ ] **Step 2: 기본 레이아웃을 만든다**

`src/layouts/BaseLayout.astro`
```astro
---
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "../styles/global.css";

interface Props {
  title: string;
  description: string;
  image?: string | null;
  noindex?: boolean;
  ownerName?: string | null;
}

const { title, description, image = null, noindex = false, ownerName = null } = Astro.props;
const imageUrl = image ? new URL(image, Astro.url).href : null;
const year = new Date().getFullYear();
---

<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    {noindex && <meta name="robots" content="noindex" />}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={Astro.url.href} />
    {imageUrl && <meta property="og:image" content={imageUrl} />}
    <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
  </head>
  <body>
    <slot />
    {
      ownerName && (
        <footer class="site-footer">
          <div class="container">© {year} {ownerName}</div>
        </footer>
      )
    }
  </body>
</html>
```

- [ ] **Step 3: 404·500 페이지와 아이콘을 만든다**

`src/pages/404.astro`
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="페이지를 찾을 수 없어요" description="요청한 페이지가 없거나 지금은 볼 수 없어요." noindex>
  <main class="container status">
    <p class="code">404</p>
    <h1>페이지를 찾을 수 없어요</h1>
    <p class="desc">주소가 바뀌었거나 지금은 볼 수 없는 작품이에요.</p>
    <a class="btn btn-primary" href="/">홈으로 가기</a>
  </main>
</BaseLayout>

<style>
  .status {
    display: grid;
    justify-items: center;
    gap: 14px;
    padding-top: 120px;
    padding-bottom: 120px;
    text-align: center;
  }
  .code {
    color: var(--muted);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  h1 {
    font-size: clamp(26px, 5vw, 36px);
    font-weight: 800;
  }
  .desc {
    margin-bottom: 12px;
    color: var(--muted);
  }
</style>
```

`src/pages/500.astro`
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="문제가 생겼어요" description="잠시 후 다시 시도해 주세요." noindex>
  <main class="container status">
    <p class="code">500</p>
    <h1>문제가 생겼어요</h1>
    <p class="desc">잠시 후 다시 시도해 주세요.</p>
    <a class="btn btn-primary" href="/">홈으로 가기</a>
  </main>
</BaseLayout>

<style>
  .status {
    display: grid;
    justify-items: center;
    gap: 14px;
    padding-top: 120px;
    padding-bottom: 120px;
    text-align: center;
  }
  .code {
    color: var(--muted);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  h1 {
    font-size: clamp(26px, 5vw, 36px);
    font-weight: 800;
  }
  .desc {
    margin-bottom: 12px;
    color: var(--muted);
  }
</style>
```

`public/favicon.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#111418"/><rect x="8" y="8" width="7" height="16" rx="2" fill="#ffffff"/><rect x="17" y="8" width="7" height="7" rx="2" fill="#3354e0"/><rect x="17" y="17" width="7" height="7" rx="2" fill="#ffffff"/></svg>
```

- [ ] **Step 4: 타입 검사와 빌드를 확인한다**

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: 마지막 줄 `Complete!`

- [ ] **Step 5: 커밋한다**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro src/pages/404.astro src/pages/500.astro public/favicon.svg
git commit -m "feat: add base layout, design tokens and error pages"
```

---

### Task 7: 홈 화면, 예시 데이터, 화면 점검 스크립트

**Files:**
- Create: `src/components/ProfileHero.astro`, `src/components/WorkCard.astro`, `src/components/FilterBar.astro`, `src/components/EmptyState.astro`
- Modify: `src/pages/index.astro`(작업 1의 임시 파일 전체를 바꿈)
- Create: `seed/dev.sql`, `scripts/smoke.mjs`

**Interfaces:**
- Consumes: `getProfile`, `listPublicWorks`(작업 5), `parseFilters`, `applyFilters`, `filterOptions`, `hasActiveFilters`, `emptyStateMessage`, `isAwarded`(작업 3), `yearOf`(작업 3), `summaryOf`, `fieldColor`(작업 4), `BaseLayout`(작업 6)
- Produces: `WorkCard` props `{ work: Work; list: "featured" | "all"; coverUrl?: string | null }`. 3단계에서 `coverUrl`을 넘긴다. `<article>`에 `data-list`와 `data-work`(slug)를 붙인다. 화면 점검 스크립트가 이 속성을 읽는다.
- Produces: `FilterBar` props `{ filters: WorkFilters; fields: string[]; years: number[] }`. GET 폼이고, `action`은 `/#works`, 값을 바꾸면 스크립트로 바로 제출한다.
- Produces: 예시 데이터. 공개 작품 6개, 비공개 1개, 자기소개 이름은 `홍길동`

- [ ] **Step 1: 홈 구성 요소를 만든다**

`src/components/ProfileHero.astro`
```astro
---
import type { Profile } from "../lib/types";

interface Props {
  profile: Profile;
}

const { profile } = Astro.props;
const hasContacts = profile.email !== null || profile.githubUrl !== null || profile.links.length > 0;
---

<header class="hero">
  <div class="container">
    <p class="eyebrow">Portfolio</p>
    <h1>{profile.name}</h1>
    {profile.headline && <p class="headline">{profile.headline}</p>}
    {profile.bio && <p class="bio">{profile.bio}</p>}
    {
      hasContacts && (
        <ul class="contacts">
          {profile.email && (
            <li>
              <a class="btn btn-primary" href={`mailto:${profile.email}`}>이메일</a>
            </li>
          )}
          {profile.githubUrl && (
            <li>
              <a class="btn" href={profile.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
            </li>
          )}
          {profile.links.map((link) => (
            <li>
              <a class="btn" href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
            </li>
          ))}
        </ul>
      )
    }
  </div>
</header>

<style>
  .hero {
    padding: 96px 0 24px;
  }
  .eyebrow {
    margin-bottom: 16px;
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  h1 {
    font-size: clamp(36px, 7vw, 60px);
    font-weight: 800;
    letter-spacing: -0.035em;
  }
  .headline {
    max-width: 34em;
    margin-top: 16px;
    color: var(--ink);
    font-size: clamp(19px, 2.6vw, 24px);
    font-weight: 600;
  }
  .bio {
    max-width: 40em;
    margin-top: 12px;
    white-space: pre-line;
  }
  .contacts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 28px 0 0;
    padding: 0;
    list-style: none;
  }
  @media (max-width: 640px) {
    .hero {
      padding-top: 64px;
    }
  }
</style>
```

`src/components/WorkCard.astro`
```astro
---
import type { Work } from "../lib/types";
import { fieldColor } from "../lib/works/fieldColor";
import { isAwarded } from "../lib/works/filter";
import { yearOf } from "../lib/works/sort";
import { summaryOf } from "../lib/works/summary";

interface Props {
  work: Work;
  list: "featured" | "all";
  coverUrl?: string | null;
}

const { work, list, coverUrl = null } = Astro.props;
const href = `/works/${encodeURIComponent(work.slug)}`;
const color = fieldColor(work.fields[0]);
const meta = [work.competition, `${yearOf(work)}년`].filter((part) => part !== null).join(" · ");
---

<article class:list={["card", { "card-large": list === "featured" }]} data-list={list} data-work={work.slug}>
  <div class="cover">
    {
      coverUrl ? (
        <img src={coverUrl} alt="" loading="lazy" />
      ) : (
        <div class="cover-fallback" style={`--fb-bg:${color.bg};--fb-fg:${color.fg}`} aria-hidden="true">
          <span>{work.title}</span>
        </div>
      )
    }
  </div>
  <div class="body">
    <ul class="tags">{work.fields.map((field) => <li class="tag">{field}</li>)}</ul>
    <h3 class="title"><a href={href}>{work.title}</a></h3>
    <p class="summary">{summaryOf(work)}</p>
    <div class="meta">
      <span>{meta}</span>
      {isAwarded(work) && <span class="badge-award">{work.award}</span>}
    </div>
  </div>
</article>

<style>
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: #fff;
    transition:
      border-color 0.15s ease,
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }
  .card:hover {
    border-color: #cfd3da;
    box-shadow: 0 10px 30px -18px rgba(17, 20, 24, 0.35);
    transform: translateY(-2px);
  }
  .card:has(a:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .cover {
    aspect-ratio: 16 / 10;
    background: var(--surface);
  }
  .card-large .cover {
    aspect-ratio: 16 / 9;
  }
  .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cover-fallback {
    display: flex;
    align-items: flex-end;
    width: 100%;
    height: 100%;
    padding: 20px;
    background: var(--fb-bg);
    color: var(--fb-fg);
  }
  .cover-fallback span {
    display: -webkit-box;
    overflow: hidden;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.25;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
  .card-large .cover-fallback span {
    font-size: 30px;
  }
  .body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    padding: 18px 20px 20px;
  }
  .title {
    font-size: 19px;
    font-weight: 700;
  }
  .card-large .title {
    font-size: 22px;
  }
  .title a {
    text-decoration: none;
  }
  .title a:focus-visible {
    outline: none;
  }
  .title a::after {
    position: absolute;
    inset: 0;
    content: "";
  }
  .summary {
    display: -webkit-box;
    overflow: hidden;
    font-size: 15px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: auto;
    padding-top: 6px;
    color: var(--muted);
    font-size: 14px;
  }
  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }
    .card:hover {
      transform: none;
    }
  }
</style>
```

`src/components/FilterBar.astro`
```astro
---
import type { WorkFilters } from "../lib/types";
import { hasActiveFilters } from "../lib/works/filter";

interface Props {
  filters: WorkFilters;
  fields: string[];
  years: number[];
}

const { filters, fields, years } = Astro.props;
---

<form class="filters" method="get" action="/#works" data-filter-form>
  <label>
    <span class="visually-hidden">분야</span>
    <select name="field">
      <option value="">모든 분야</option>
      {fields.map((field) => <option value={field} selected={filters.field === field}>{field}</option>)}
    </select>
  </label>
  <label>
    <span class="visually-hidden">연도</span>
    <select name="year">
      <option value="">모든 연도</option>
      {years.map((year) => <option value={String(year)} selected={filters.year === year}>{year}년</option>)}
    </select>
  </label>
  <label class="check">
    <input type="checkbox" name="award" value="1" checked={filters.award} />
    <span>수상작만</span>
  </label>
  <button class="btn" type="submit">적용</button>
  {hasActiveFilters(filters) && <a class="reset" href="/#works">조건 지우기</a>}
</form>

<script>
  const form = document.querySelector<HTMLFormElement>("[data-filter-form]");
  form?.addEventListener("change", () => form.requestSubmit());
</script>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  select {
    height: 40px;
    padding: 0 36px 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%236b7280' stroke-width='1.6'/%3E%3C/svg%3E")
      no-repeat right 14px center / 12px;
    color: var(--ink);
    font: inherit;
    font-size: 15px;
    cursor: pointer;
    appearance: none;
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink);
    font-size: 15px;
    cursor: pointer;
  }
  .check input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--ink);
  }
  .reset {
    color: var(--muted);
    font-size: 14px;
  }
</style>
```

`src/components/EmptyState.astro`
```astro
---
interface Props {
  message: string;
  showReset: boolean;
}

const { message, showReset } = Astro.props;
---

<div class="empty">
  <p>{message}</p>
  {showReset && <a class="btn" href="/#works">조건 지우기</a>}
</div>

<style>
  .empty {
    display: grid;
    justify-items: center;
    gap: 16px;
    padding: 56px 20px;
    border: 1px dashed var(--line);
    border-radius: var(--radius);
    color: var(--muted);
    text-align: center;
  }
</style>
```

- [ ] **Step 2: 홈 페이지를 바꾼다**

`src/pages/index.astro`(전체 교체)
```astro
---
import { env } from "cloudflare:workers";
import EmptyState from "../components/EmptyState.astro";
import FilterBar from "../components/FilterBar.astro";
import ProfileHero from "../components/ProfileHero.astro";
import WorkCard from "../components/WorkCard.astro";
import BaseLayout from "../layouts/BaseLayout.astro";
import { getProfile } from "../lib/db/profile";
import { listPublicWorks } from "../lib/db/works";
import { applyFilters, emptyStateMessage, filterOptions, hasActiveFilters, parseFilters } from "../lib/works/filter";

const [profile, works] = await Promise.all([getProfile(env.DB), listPublicWorks(env.DB)]);
const filters = parseFilters(Astro.url.searchParams);
const featured = works.filter((work) => work.isFeatured);
const visible = applyFilters(works, filters);
const options = filterOptions(works);
const description = profile.headline ?? `${profile.name}의 작업과 수상 기록을 모은 포트폴리오`;
---

<BaseLayout title={`${profile.name} | 포트폴리오`} description={description} ownerName={profile.name}>
  <ProfileHero profile={profile} />
  <main>
    {
      featured.length > 0 && (
        <section class="section container" aria-labelledby="featured-title">
          <h2 id="featured-title" class="section-title">대표작</h2>
          <div class="grid grid-featured">
            {featured.map((work) => (
              <WorkCard work={work} list="featured" />
            ))}
          </div>
        </section>
      )
    }
    <section id="works" class="section container" aria-labelledby="works-title">
      <div class="section-head">
        <h2 id="works-title" class="section-title">전체 작품 <span class="count">{visible.length}</span></h2>
        {works.length > 0 && <FilterBar filters={filters} fields={options.fields} years={options.years} />}
      </div>
      {
        visible.length > 0 ? (
          <div class="grid">
            {visible.map((work) => (
              <WorkCard work={work} list="all" />
            ))}
          </div>
        ) : (
          <EmptyState
            message={emptyStateMessage(works.length, filters)}
            showReset={works.length > 0 && hasActiveFilters(filters)}
          />
        )
      }
    </section>
  </main>
</BaseLayout>

<style>
  .section {
    margin-top: 72px;
  }
  .section-title {
    font-size: 24px;
    font-weight: 800;
  }
  .section > .section-title {
    margin-bottom: 24px;
  }
  .section-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }
  .count {
    margin-left: 4px;
    color: var(--muted);
    font-weight: 600;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: 20px;
  }
  .grid-featured {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  }
</style>
```

- [ ] **Step 3: 예시 데이터와 화면 점검 스크립트를 만든다**

`seed/dev.sql`
```sql
-- 로컬 개발용 예시 데이터. 운영 DB에는 넣지 않는다. 여러 번 실행해도 결과가 같다.
UPDATE profile SET
  name = '홍길동',
  headline = '만들고 기록하는 개발자이자 디자이너',
  bio = '대회와 프로젝트에서 만든 작업을 모았습니다. 새로운 문제를 함께 풀 팀을 찾고 있어요.',
  email = 'hello@example.com',
  github_url = 'https://github.com/example',
  links_json = '[{"label":"블로그","url":"https://example.com"}]',
  updated_at = '2026-10-28T00:00:00.000Z'
WHERE id = 1;

DELETE FROM files WHERE work_id LIKE 'seed-%';
DELETE FROM works WHERE id LIKE 'seed-%';

INSERT INTO works (id, slug, title, summary, description_html, fields_json, techs_json, links_json, competition, organizer, participated_on, period_start, period_end, award, team_type, team_size, role, is_public, is_featured, created_at, updated_at) VALUES
('seed-1', '캠퍼스-분실물-지도', '캠퍼스 분실물 지도', '잃어버린 물건을 지도에서 바로 찾는 학교 서비스',
 '<h2>문제</h2><p>분실물 게시판이 학과마다 흩어져 있어 찾기 어려웠습니다.</p><h2>해결</h2><ul><li>지도 위에 습득 위치 표시</li><li>물건 종류별 알림 구독</li></ul>',
 '["개발","기획"]', '["React","Firebase"]',
 '[{"kind":"github","label":"소스 코드","url":"https://github.com/example/lost-map"},{"kind":"video","label":"시연 영상","url":"https://www.youtube.com/watch?v=aqz-KE-bpKQ"}]',
 '2025 대학생 해커톤', '한국정보과학회', '2025-08-23', '2025-08-22', '2025-08-23', '대상', 'team', 4, '프론트엔드 개발, 발표', 1, 1,
 '2025-08-24T00:00:00.000Z', '2025-08-24T00:00:00.000Z'),
('seed-2', '졸업전시-포스터-시리즈', '졸업전시 포스터 시리즈', '타이포그래피로 풀어낸 졸업전시 포스터 6종',
 '<p>전시 주제인 <em>경계</em>를 글자의 겹침으로 표현했습니다.</p>',
 '["디자인"]', '["Figma","Illustrator"]', '[]',
 NULL, NULL, NULL, '2024-09-01', '2024-11-30', NULL, 'solo', NULL, '기획과 디자인 전체', 1, 0,
 '2024-12-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('seed-3', '지역-상권-데이터-분석', '지역 상권 데이터 분석', '공공데이터로 골목 상권의 변화를 읽어낸 분석 보고서',
 '<p>5년치 카드 매출 데이터를 동 단위로 정리했습니다.</p><blockquote>폐업률보다 업종 전환율이 먼저 움직였습니다.</blockquote>',
 '["데이터","기획"]', '["Python","pandas"]', '[{"kind":"demo","label":"보고서 보기","url":"https://example.com/report"}]',
 '공공데이터 활용 공모전', '행정안전부', '2024-06-15', NULL, NULL, '우수상', 'team', 3, '데이터 정제와 시각화', 1, 1,
 '2024-06-20T00:00:00.000Z', '2024-06-20T00:00:00.000Z'),
('seed-4', '할-일-정리-앱', '할 일 정리 앱', NULL,
 '<p>매일 할 일을 <strong>세 가지</strong>만 고르게 돕는 앱입니다.</p><p>알림 대신 저녁 회고 화면을 넣었습니다.</p>',
 '["개발"]', '["Kotlin"]', '[{"kind":"github","label":"","url":"https://github.com/example/todo"}]',
 '교내 앱 개발 대회', '컴퓨터공학과', '2026-03-10', NULL, NULL, '', 'solo', NULL, '앱 개발 전체', 1, 0,
 '2026-03-11T00:00:00.000Z', '2026-03-11T00:00:00.000Z'),
('seed-5', 'private-draft', '비공개 초안 작품', '아직 공개하지 않은 작품',
 '<p>초안</p>',
 '["개발"]', '[]', '[]',
 NULL, NULL, '2026-05-01', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0,
 '2026-05-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z'),
('seed-6', 'brand-identity', '카페 브랜드 아이덴티티', '동네 카페의 로고와 패키지를 새로 만든 작업',
 '<p>로고, 컵 슬리브, 메뉴판을 한 가지 형태 언어로 묶었습니다.</p>',
 '["디자인"]', '["Illustrator"]', '[]',
 '청년 창업 디자인 공모전', '서울디자인재단', '2025-02-20', NULL, NULL, '입선', 'team', 2, '로고 디자인', 1, 0,
 '2025-02-21T00:00:00.000Z', '2025-02-21T00:00:00.000Z'),
('seed-7', '메모-위젯', '메모 위젯', NULL,
 '<p>바탕화면에 붙여 두는 작은 메모 위젯입니다.</p>',
 '["개발"]', '[]', '[]',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0,
 '2023-05-01T09:00:00.000Z', '2023-05-01T09:00:00.000Z');
```

`scripts/smoke.mjs`: 개발 서버를 4398번 포트로 띄워 점검하고, 끝나면 프로세스 트리째 끈다. 포트를 바꾸려면 `SMOKE_PORT` 환경 변수를 쓴다.
```js
// 로컬 개발 서버를 직접 띄워 방문자 화면을 점검하고 끈다.
// 먼저 `npm run db:migrate:local` 과 `npm run db:seed:local` 을 실행해야 한다.
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";

const port = Number(process.env.SMOKE_PORT ?? 4398);
const base = `http://localhost:${port}`;
const astroBin = path.resolve("node_modules/astro/bin/astro.mjs");
const server = spawn(process.execPath, [astroBin, "dev", "--port", String(port)], { stdio: "ignore" });

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`ok   ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function stopServer() {
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // 이미 끝난 프로세스
    }
  } else {
    server.kill("SIGTERM");
  }
}

async function waitReady() {
  for (let i = 0; i < 90; i += 1) {
    try {
      await fetch(`${base}/`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("개발 서버가 90초 안에 뜨지 않았다");
}

async function get(pathname) {
  const res = await fetch(base + pathname);
  return { status: res.status, html: await res.text() };
}

function cards(html, list) {
  const slugs = [];
  for (const tag of html.match(/<article\b[^>]*>/g) ?? []) {
    const tagList = tag.match(/data-list="([^"]*)"/)?.[1];
    const slug = tag.match(/data-work="([^"]*)"/)?.[1];
    if (tagList === list && slug !== undefined) slugs.push(slug);
  }
  return slugs;
}

function metaContent(html, attr, value) {
  const tag = html.match(new RegExp(`<meta\\b[^>]*${attr}="${value}"[^>]*>`))?.[0];
  return tag?.match(/content="([^"]*)"/)?.[1] ?? null;
}

function h1(html) {
  return html.match(/<h1\b[^>]*>([^<]*)<\/h1>/)?.[1]?.trim() ?? null;
}

const query = (params) => `/?${new URLSearchParams(params).toString()}`;
const workPath = (slug) => `/works/${encodeURIComponent(slug)}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const ALL = ["할-일-정리-앱", "캠퍼스-분실물-지도", "brand-identity", "졸업전시-포스터-시리즈", "지역-상권-데이터-분석", "메모-위젯"];

try {
  await waitReady();

  const home = await get("/");
  check("홈 200", home.status === 200, String(home.status));
  check("홈 이름", h1(home.html) === "홍길동", String(h1(home.html)));
  check("홈 og:title", metaContent(home.html, "property", "og:title") === "홍길동 | 포트폴리오");
  check(
    "대표작 순서",
    same(cards(home.html, "featured"), ["캠퍼스-분실물-지도", "지역-상권-데이터-분석"]),
    cards(home.html, "featured").join(","),
  );
  check("전체 작품 순서와 비공개 제외", same(cards(home.html, "all"), ALL), cards(home.html, "all").join(","));
  check("연도 선택지에 2023", home.html.includes('value="2023"'));

  const cases = [
    [{ field: "디자인" }, ["brand-identity", "졸업전시-포스터-시리즈"]],
    [{ year: "2024" }, ["졸업전시-포스터-시리즈", "지역-상권-데이터-분석"]],
    [{ award: "1" }, ["캠퍼스-분실물-지도", "brand-identity", "지역-상권-데이터-분석"]],
    [{ field: "기획", award: "1" }, ["캠퍼스-분실물-지도", "지역-상권-데이터-분석"]],
    [{ year: "abcd" }, ALL],
  ];
  for (const [params, want] of cases) {
    const page = await get(query(params));
    const got = cards(page.html, "all");
    check(`걸러 보기 ${JSON.stringify(params)}`, page.status === 200 && same(got, want), got.join(","));
  }

  const none = await get(query({ field: "없는분야" }));
  check("조건 불일치 안내", cards(none.html, "all").length === 0 && none.html.includes("조건에 맞는 작품이 없어요."));

  const campus = await get(workPath("캠퍼스-분실물-지도"));
  check(
    "상세 200 (한글 주소)",
    campus.status === 200 && h1(campus.html) === "캠퍼스 분실물 지도",
    `${campus.status} ${h1(campus.html)}`,
  );
  check("상세 og:title", metaContent(campus.html, "property", "og:title") === "캠퍼스 분실물 지도 | 홍길동");
  check(
    "상세 정보 항목",
    ["2025.08.23", "팀 (4명)", "대상", "2025 대학생 해커톤"].every((text) => campus.html.includes(text)),
  );
  check("유튜브 퍼가기", campus.html.includes("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"));

  const todo = await get(workPath("할-일-정리-앱"));
  check(
    "요약이 없으면 설명 앞부분",
    (metaContent(todo.html, "name", "description") ?? "").startsWith("매일 할 일을 세 가지만"),
  );

  const memo = await get(workPath("메모-위젯"));
  check(
    "빈 선택 항목은 표시하지 않음",
    memo.status === 200 && !memo.html.includes("<dt") && !memo.html.includes("<iframe"),
  );

  const hidden = await get(workPath("private-draft"));
  check("비공개 작품 404", hidden.status === 404, String(hidden.status));

  const missing = await get(workPath("없는-작품"));
  check(
    "없는 작품 404 안내",
    missing.status === 404 && h1(missing.html) === "페이지를 찾을 수 없어요",
    `${missing.status} ${h1(missing.html)}`,
  );
} finally {
  stopServer();
}

console.log(`smoke: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 4: 타입 검사와 빌드를 확인한다**

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: 마지막 줄 `Complete!`

- [ ] **Step 5: 예시 데이터를 넣고 화면을 점검한다(상세 페이지가 아직 없으므로 6개 실패가 맞다)**

Run: `npm run db:migrate:local`
Expected: `No migrations to apply` 또는 `0001_init.sql │ ✅`

Run: `npm run db:seed:local`
Expected: JSON 출력에 `"success": true`

Run: `npm run smoke`
Expected: 아래 6줄만 `FAIL`이고 마지막 줄이 `smoke: 14 passed, 6 failed`(종료 코드 1)
```
FAIL 상세 200 (한글 주소) — 404 페이지를 찾을 수 없어요
FAIL 상세 og:title
FAIL 상세 정보 항목
FAIL 유튜브 퍼가기
FAIL 요약이 없으면 설명 앞부분
FAIL 빈 선택 항목은 표시하지 않음
```

- [ ] **Step 6: 커밋한다**

```bash
git add src/components/ProfileHero.astro src/components/WorkCard.astro src/components/FilterBar.astro src/components/EmptyState.astro src/pages/index.astro seed/dev.sql scripts/smoke.mjs
git commit -m "feat: add home page with featured works, filters and seed data"
```

---

### Task 8: 작품 상세 페이지

**Files:**
- Create: `src/pages/works/[slug].astro`

**Interfaces:**
- Consumes: `getPublicWorkBySlug`, `getProfile`(작업 5), `formatDate`, `formatPeriod`, `teamLabel`, `summaryOf`, `youtubeEmbedUrl`(작업 4), `isAwarded`(작업 3), `LINK_KIND_LABELS`(작업 2), `BaseLayout`(작업 6)
- 동작: 공개 작품이 없으면 `return Astro.rewrite("/404")`로 404 상태와 안내 페이지를 낸다(사전 검증함). 정보 항목은 값이 있는 것만 `<dl>`로 보여주고, 하나도 없으면 `<dl>`을 만들지 않는다. 링크 이름이 비면 종류 이름(`GitHub` 등)을 쓴다.

- [ ] **Step 1: 실패 상태를 확인한다**

Run: `npm run smoke`
Expected: `smoke: 14 passed, 6 failed`(작업 7과 같음)

- [ ] **Step 2: 상세 페이지를 만든다**

`src/pages/works/[slug].astro`
```astro
---
import { env } from "cloudflare:workers";
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getProfile } from "../../lib/db/profile";
import { getPublicWorkBySlug } from "../../lib/db/works";
import { formatDate, formatPeriod, teamLabel } from "../../lib/format";
import { LINK_KIND_LABELS } from "../../lib/types";
import { isAwarded } from "../../lib/works/filter";
import { summaryOf } from "../../lib/works/summary";
import { youtubeEmbedUrl } from "../../lib/works/youtube";

const work = await getPublicWorkBySlug(env.DB, Astro.params.slug ?? "");
if (!work) {
  return Astro.rewrite("/404");
}

const profile = await getProfile(env.DB);
const facts = [
  { label: "대회", value: work.competition },
  { label: "주최", value: work.organizer },
  { label: "참가일", value: work.participatedOn ? formatDate(work.participatedOn) : null },
  { label: "작업 기간", value: formatPeriod(work.periodStart, work.periodEnd) },
  { label: "팀/개인", value: teamLabel(work.teamType, work.teamSize) },
  { label: "내 역할", value: work.role },
].filter((fact): fact is { label: string; value: string } => fact.value !== null);
const videos = work.links.flatMap((link) => {
  const embed = link.kind === "video" ? youtubeEmbedUrl(link.url) : null;
  return embed ? [{ title: link.label || "영상", embed }] : [];
});
---

<BaseLayout title={`${work.title} | ${profile.name}`} description={summaryOf(work)} ownerName={profile.name}>
  <main class="container detail">
    <a class="back" href="/#works">← 전체 작품</a>
    <header class="head">
      <ul class="tags">{work.fields.map((field) => <li class="tag">{field}</li>)}</ul>
      <h1>{work.title}</h1>
      {work.summary && <p class="lead">{work.summary}</p>}
      {isAwarded(work) && <p class="badge-award">{work.award}</p>}
    </header>

    {
      facts.length > 0 && (
        <dl class="facts">
          {facts.map((fact) => (
            <div>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )
    }

    {
      work.links.length > 0 && (
        <ul class="links">
          {work.links.map((link) => {
            const kindLabel = LINK_KIND_LABELS[link.kind];
            return (
              <li>
                <a class="btn" href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label || kindLabel}
                  {link.label && link.label !== kindLabel && <span class="kind">{kindLabel}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      )
    }

    {
      work.techs.length > 0 && (
        <section class="block">
          <h2>사용 기술</h2>
          <ul class="tags">{work.techs.map((tech) => <li class="tag">{tech}</li>)}</ul>
        </section>
      )
    }

    <section class="block">
      <h2>작품 설명</h2>
      <div class="prose" set:html={work.descriptionHtml} />
    </section>

    {
      videos.length > 0 && (
        <section class="block">
          <h2>영상</h2>
          {videos.map((video) => (
            <div class="video">
              <iframe
                src={video.embed}
                title={video.title}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              />
            </div>
          ))}
        </section>
      )
    }
  </main>
</BaseLayout>

<style>
  .detail {
    max-width: 820px;
    padding-top: 40px;
  }
  .back {
    display: inline-block;
    margin-bottom: 32px;
    color: var(--muted);
    font-size: 15px;
    text-decoration: none;
  }
  .back:hover {
    color: var(--ink);
  }
  .head {
    display: grid;
    gap: 14px;
  }
  h1 {
    font-size: clamp(30px, 5vw, 44px);
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .lead {
    color: var(--ink);
    font-size: 19px;
  }
  .head .badge-award {
    justify-self: start;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 20px;
    margin: 36px 0 0;
    border-top: 1px solid var(--line);
  }
  @media (min-width: 640px) {
    .facts {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .facts div {
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }
  .facts dt {
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
  }
  .facts dd {
    margin: 2px 0 0;
    color: var(--ink);
    font-weight: 600;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 28px 0 0;
    padding: 0;
    list-style: none;
  }
  .kind {
    color: var(--muted);
    font-size: 12px;
  }
  .block {
    margin-top: 48px;
  }
  .block h2 {
    margin-bottom: 16px;
    font-size: 20px;
    font-weight: 800;
  }
  .prose {
    font-size: 17px;
    line-height: 1.8;
  }
  .prose :global(h2) {
    margin: 32px 0 12px;
    font-size: 20px;
  }
  .prose :global(h3) {
    margin: 28px 0 10px;
    font-size: 18px;
  }
  .prose :global(p),
  .prose :global(ul),
  .prose :global(ol),
  .prose :global(blockquote),
  .prose :global(pre) {
    margin: 0 0 14px;
  }
  .prose :global(ul),
  .prose :global(ol) {
    padding-left: 1.3em;
  }
  .prose :global(blockquote) {
    padding: 4px 0 4px 16px;
    border-left: 3px solid var(--line);
    color: var(--muted);
  }
  .prose :global(a) {
    color: var(--accent);
  }
  .prose :global(pre) {
    overflow-x: auto;
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: 14px;
  }
  .prose :global(code) {
    font-family: ui-monospace, Consolas, monospace;
    font-size: 0.92em;
  }
  .video {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    margin-bottom: 16px;
    border-radius: var(--radius);
    background: #000;
  }
  .video iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }
</style>
```

- [ ] **Step 3: 통과를 확인한다**

Run: `npm run check`
Expected: `0 errors`

Run: `npm run smoke`
Expected: 모든 줄이 `ok`이고 마지막 줄이 `smoke: 20 passed, 0 failed`(종료 코드 0)

- [ ] **Step 4: 커밋한다**

```bash
git add src/pages/works
git commit -m "feat: add public work detail page"
```

---

### Task 9: 최종 검증과 인계

**Files:**
- Create: `collab/HANDOFF.md`

- [ ] **Step 1: 전체 검증을 순서대로 실행한다**

Run: `npm test`
Expected: `Test Files  10 passed (10)`, `Tests  51 passed (51)`

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: `Complete!`

Run: `npm run smoke`
Expected: `smoke: 20 passed, 0 failed`

- [ ] **Step 2: 남은 개발 서버가 없는지 확인한다**

Run(PowerShell): `Get-NetTCPConnection -LocalPort 4398 -State Listen -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count`
Expected: `0`

- [ ] **Step 3: `collab/HANDOFF.md`를 쓴다**

협업 규칙 6번 형식으로 쓴다.
- 실행한 계획 파일 경로, 완료한 작업과 남은 작업
- 계획과 다르게 한 부분과 이유(없으면 "없음")
- 수정·새 파일 목록: `git status --short`, 그리고 `git diff --stat <이 계획 파일을 커밋한 해시>..HEAD`의 결과. 해시는 `git log -1 --format=%h -- docs/superpowers/plans/2026-10-28-stage1-foundation-public-pages.md`로 찾는다.
- 위 검증 명령 4개의 종료 코드와 결과 줄
- 막힌 지점, 질문, 남은 위험

비밀값은 넣지 않는다.

- [ ] **Step 4: 커밋한다**

```bash
git add collab/HANDOFF.md
git commit -m "docs: add stage 1 handoff"
```

---

## 리뷰 때 Claude가 볼 것

- 화면: 375px와 1280px 폭에서 홈, 상세, 404를 실제 브라우저로 본다(스펙 6.3).
- 계획 대비 diff: 허용 목록 밖 파일, 문구 변경, 버전 변경이 있는지 본다.
- `HANDOFF.md`의 검증 결과와 직접 다시 실행한 결과가 같은지 본다.

---

## 수정 작업 1 (2026-10-29, 사용자 승인)

**이유:** Codex 실행 샌드박스는 `.git` 폴더 쓰기를 막는다. 첫 실행에서 작업 1 Step 9의 `git add`가 `.git/index.lock` 권한 거부(종료 코드 128)로 실패해 멈췄다. 작업 1의 Step 1~8은 계획대로 끝났다.

**바뀐 점(아래 내용이 앞의 작업 설명보다 우선한다):**

1. **커밋하지 않는다.** 모든 작업의 "커밋한다" 단계에서는 `git add`와 `git commit`을 실행하지 않는다. 그 단계에서는 `git status --short`로 해당 작업의 파일이 계획의 `git add` 목록과 같은지만 확인하고, `collab/HANDOFF.md`의 진행 기록에 "작업 N 완료"를 적은 뒤 다음 작업으로 넘어간다. 커밋은 리뷰 뒤 Claude가 계획의 커밋 명령 그대로 실행한다.
2. **작업 2 Step 1부터 시작한다.** 작업 1은 Claude가 다시 검증하고 커밋했다(`6b30882`). 작업 1 파일은 다시 만들지 않고, `npm install`도 다시 하지 않는다(이미 설치됨).
3. **저장소 밖 기본 경로 쓰기가 막히면** 첫 실행 때처럼 그 명령에서만 `npm_config_cache`와 `WRANGLER_LOG_PATH`를 시스템 임시 폴더로 지정해도 된다. 프로젝트 파일은 바꾸지 않는다.
4. **작업 9 Step 2의 포트 확인 명령이 거부되면** "미실행(환경 거부)"로 적고 넘어간다. Claude가 리뷰 때 확인한다.
5. **작업 9 Step 3:** `collab/HANDOFF.md`를 처음부터 다시 쓴다. 첫 실행(작업 1에서 멈춤)과 이번 실행을 모두 요약한다. 수정·새 파일 목록은 `git status --short --untracked-files=all` 결과로 적는다. 작업 9 Step 4(커밋)는 실행하지 않는다.
