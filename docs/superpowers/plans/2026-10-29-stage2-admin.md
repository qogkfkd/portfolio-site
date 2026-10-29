# 2단계: 로그인과 작품 관리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **이 프로젝트의 실행 방식:** 협업 규칙(`C:/Users/bhr46/.codex-collab/RULES.md`)에 따라 Codex가 superpowers:executing-plans 방식으로 작업 1부터 11까지 순서대로 실행한다. 계획에 적힌 코드를 그대로 옮겨 적는다. 계획이 모호하거나 틀렸거나 같은 오류에 두 번 막히면 그 자리에서 멈추고 `collab/HANDOFF.md`에 적는다.

**Goal:** 사이트 주인만 비밀번호로 로그인해 작품을 작성·수정·삭제하고, 공개·대표작을 바꾸고, 자기소개를 고칠 수 있게 한다.

**Architecture:**
- **인증:** 비밀번호는 PBKDF2 해시로, 로그인 상태는 HMAC 서명 쿠키로 관리한다. 미들웨어가 `/admin`과 `/api/admin` 아래를 보호한다.
- **화면과 API:** 관리자 화면은 Astro 페이지로 만든다. 작성·수정 폼은 React 컴포넌트(`client:only`)이고, JSON API에 저장한다. 목록의 공개·대표작·삭제 버튼은 JavaScript 없이 동작하는 일반 폼이다.
- **서식 정리:** 작품 설명 HTML은 저장할 때와 화면에 낼 때 모두 Workers에 내장된 HTMLRewriter로 정리한다.

**Tech Stack:** 1단계 구성(Astro 7.4.2, @astrojs/cloudflare 14.4.2, D1, Vitest 5.0.5 + @cloudflare/vitest-plugin 1.4.9)에 다음을 더한다.
- @astrojs/react 7.1.2, React 19.3.1
- Tiptap 3.32.1 (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`)
- @types/react 19.3.0, @types/react-dom 19.3.0

**Spec:** `docs/superpowers/specs/2026-10-27-portfolio-site-design.md`
- 3.1 비공개 미리보기
- 3.2 관리자 화면
- 4.1 작품 항목과 주소(slug)
- 4.2 자기소개
- 5.1 로그인
- 5.3 서식 정리
- 5.6 오류 처리
- 10장 2단계

## 실행 계약

- **기준:** `main` 브랜치에서 이 계획 파일을 커밋한 지점. 그 앞은 1단계 인계 커밋 `d6d2d38`이다.
- **Codex가 하지 않는 것(1단계에서 확인한 샌드박스 제약):**
  - **커밋:** `.git`에 쓸 수 없다. 각 작업의 마지막 단계는 "완료 기록"이고, 커밋은 리뷰 뒤 Claude가 작업별로 한다.
  - **서버 실행:** `npm run dev`, `npm run preview`, `npm run smoke`로 개발 서버를 띄울 수 없다. 화면 점검과 실제 브라우저 확인은 Claude가 리뷰 때 샌드박스 밖에서 한다.
  - **기본 경로 쓰기:** 저장소 밖 기본 경로에 쓸 수 없으면, 그 명령에서만 `npm_config_cache`와 `WRANGLER_LOG_PATH`를 시스템 임시 폴더로 지정한다.
- **완료 기준(Codex 실행분):**
  1. `npm test`: 19개 테스트 파일, 99개 테스트 통과
  2. `npm run check`: `0 errors`, `0 warnings`, `0 hints`
  3. `npm run build`: `Complete!`
  4. `collab/HANDOFF.md` 작성
- **완료 기준(Claude 리뷰분):**
  1. `npm run db:migrate:local`, `npm run db:seed:local`을 실행한 뒤 `npm run smoke`가 `smoke: 45 passed, 0 failed`
  2. 실제 브라우저로 관리자 화면을 조작하고 확인한다. 로그인, 빈 폼 오류, 태그 입력, 설명 편집기, 저장 후 수정 화면, 목록, 자기소개, 비공개 미리보기를 본다.
- **만들거나 바꿔도 되는 파일(이 목록 밖은 건드리지 않는다):**
  - 루트: `package.json`, `package-lock.json`(npm이 만듦), `astro.config.mjs`, `tsconfig.json`, `AGENTS.md`, `.dev.vars.example`, `.dev.vars`(Git 제외, 예시를 복사)
  - `scripts/hash-password.mjs`, `scripts/smoke.mjs`, `seed/dev.sql`
  - `src/env.d.ts`, `src/middleware.ts`, `src/lib/http.ts`
  - `src/lib/auth/password.ts`, `src/lib/auth/session.ts`, `src/lib/auth/request.ts`, `src/lib/auth/lockout.ts`
  - `src/lib/html/sanitize.ts`, `src/lib/works/slug.ts`
  - `src/lib/validate/common.ts`, `src/lib/validate/work.ts`, `src/lib/validate/profile.ts`
  - `src/lib/db/adminWorks.ts`, `src/lib/db/profile.ts`
  - `src/pages/api/admin/works/index.ts`, `src/pages/api/admin/works/[id]/index.ts`, `src/pages/api/admin/works/[id]/flags.ts`, `src/pages/api/admin/works/[id]/delete.ts`, `src/pages/api/admin/profile.ts`, `src/pages/api/admin/logout.ts`, `src/pages/robots.txt.ts`
  - `src/layouts/AdminLayout.astro`, `src/styles/admin.css`
  - `src/pages/admin/login.astro`, `src/pages/admin/index.astro`, `src/pages/admin/works/new.astro`, `src/pages/admin/works/[id]/edit.astro`, `src/pages/admin/profile.astro`
  - `src/components/admin/api.ts`, `src/components/admin/errors.ts`, `src/components/admin/useUnsavedWarning.ts`, `src/components/admin/Field.tsx`, `src/components/admin/TagInput.tsx`, `src/components/admin/LinkRowsInput.tsx`, `src/components/admin/RichTextEditor.tsx`, `src/components/admin/WorkForm.tsx`, `src/components/admin/ProfileForm.tsx`
  - `src/pages/works/[slug].astro`
  - `test/auth/password.test.ts`, `test/auth/session.test.ts`, `test/auth/request.test.ts`, `test/auth/lockout.test.ts`, `test/html/sanitize.test.ts`, `test/works/slug.test.ts`, `test/validate/work.test.ts`, `test/validate/profile.test.ts`, `test/db/adminWorks.test.ts`, `test/db/profile.test.ts`
  - `collab/HANDOFF.md`
- **금지 범위:**
  - R2, 파일 업로드·제공, 대표 이미지·갤러리·첨부, 프로필 사진, 저장 공간 표시는 3단계에서 한다.
  - Playwright, 배포 안내서는 4단계에서 한다.
  - `docs/` 아래 파일은 고치지 않는다. 추적되지 않는 PDF 두 개는 건드리지 않는다.
  - `wrangler login`, `wrangler deploy`, `wrangler secret`, `--remote`, `git add`/`git commit`/`git push`, 전역 설치, `npm approve-scripts`는 실행하지 않는다.
  - 패키지 버전을 바꾸지 않는다. 계획에 없는 기능, 리팩터링, 디자인 변경을 하지 않는다.

## Global Constraints

- **기존 규칙 유지:** 1단계의 Global Constraints는 그대로 지킨다(`AGENTS.md` 참고).
  - Node 22.23.4 이상
  - 바인딩은 `cloudflare:workers`의 `env`
  - DB 함수는 `db: D1Database`를 인자로 받는다.
  - D1 테스트는 `beforeEach`에서 `resetDb`
  - Astro 7 HTML 규칙
- **로그인과 보안(스펙 5.1):**
  - 관리자는 한 명이다. 비밀번호 원문을 저장하지 않는다.
  - 해시는 PBKDF2-SHA256, 반복 100,000회, 형식 `pbkdf2:반복:솔트:해시`. 구분자는 `.dev.vars`에서 `$`가 해석되는 일을 피하려고 `:`을 쓴다.
  - 쿠키 이름은 `session`이다. 속성은 `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, 유효 기간 7일.
  - 같은 IP에서 5번 연속 틀리면 15분 동안 잠그고, 성공하면 초기화한다. IP는 `CF-Connecting-IP`, 없으면 `local`.
  - 상태를 바꾸는 요청은 `Origin`이 사이트 자신일 때만 받는다. 관리자 경로에는 `X-Robots-Tag: noindex`를 붙인다. `robots.txt`에서 `/admin`을 막는다.
- **서식 정리(스펙 5.3):**
  - 허용 태그는 `p h2 h3 strong em u s ul ol li a blockquote code pre br hr`이다.
  - `a`에는 http, https, mailto `href`만 남기고 `rel="noopener noreferrer" target="_blank"`를 붙인다.
  - `script`, `style`은 내용까지 지운다. 나머지 태그는 벗기고 글자는 남긴다. 모든 속성과 HTML 주석을 지운다.
- **작품 주소(스펙 4.1):**
  - 처음 저장할 때 작품명으로 만든다. 한글을 허용하고, 겹치면 `-2`, `-3`을 붙인다.
  - 수정 화면에서 바꿀 수 있고, "바꾸면 예전 링크로는 이 작품이 열리지 않아요."라고 안내한다.
- **새 작품은 비공개로 저장한다(스펙 3.2).** 한국어 문구는 계획의 코드와 글자 하나까지 같게 쓴다.
- **로컬 관리자 비밀번호는 `portfolio-dev-password`다.** `.dev.vars.example`에 해시가 들어 있다. 로컬 개발 전용이고, 운영 비밀번호는 4단계에서 사용자가 정한다.

## Review Focus

스펙이 직접 말하지 않지만 실제 사용에서 깨지기 쉬운 입력 다섯 가지와, 이를 고정하는 테스트다.

1. **한글 입력 중 Enter(조합 중):** 태그 입력에서 글자가 반쪽으로 들어가면 안 된다. `TagInput.tsx`가 `isComposing`일 때 Enter를 무시하고, Claude의 UI 점검 "분야 태그가 칩으로 들어간다"가 확인한다.
2. **같은 작품명이나 겹치는 주소:** 같은 작품명은 `-2`가 붙어야 하고, 남의 주소로 바꾸면 거절해야 한다. `test/works/slug.test.ts`, `test/db/adminWorks.test.ts`, smoke의 "같은 이름이면 주소에 -2", "다른 작품 주소로 바꾸면 400"이 고정한다.
3. **설명에 붙여 넣은 위험한 HTML**(`<script>`, `javascript:` 링크, `onclick`): 저장과 화면 출력에서 모두 지워져야 한다. `test/html/sanitize.test.ts`와 smoke의 "설명의 script와 javascript: 링크 제거"가 고정한다.
4. **다른 사이트에서 온 요청이나 로그인이 풀린 상태의 저장:** 403/401로 거절하고, 폼은 입력을 지우지 않고 안내해야 한다. `test/auth/request.test.ts`, smoke의 "Origin 없으면 403", "로그인 없으면 401", `api.ts`의 `failureMessage`가 고정한다.
5. **잘못된 날짜나 순서가 뒤집힌 기간, 팀 인원 1명:** 칸 옆에 한국어 오류가 나와야 한다. `test/validate/work.test.ts`의 날짜·팀 테스트가 고정한다.

## 스펙과 다르게 정한 것

- 스펙 5.1은 해시 형식을 정하지 않았다. 형식은 `pbkdf2:반복:솔트:해시`로 정했다.
- 스펙 5.3은 `rel`과 `target`을 "화면에 낼 때" 붙인다고 했다. 저장할 때도 같은 정리를 거치므로, 저장된 HTML에도 이미 붙어 있다. 화면에 낼 때 한 번 더 정리해서 시드 데이터나 직접 고친 DB도 안전하다.
- 스펙 3.2의 저장 공간 사용량과 파일 관리는 3단계에서 한다. 2단계의 목록 화면에는 작품 수만 보여준다. 삭제 확인 창의 파일 수는 지금도 `files` 테이블에서 센다(지금은 0개).
- 로그아웃은 쿠키만 지운다. 이미 나간 쿠키를 서버에서 무효로 만들려면 `SESSION_SECRET`을 바꾼다(스펙 5.1과 같음).

## 사전 검증

Claude가 이 계획의 모든 파일을 현재 저장소의 복제본에서 같은 버전으로 만들어 아래 결과를 확인했다.
- `npm test`: 19개 파일, 99개 통과
- `npm run check`: 0 errors / 0 warnings / 0 hints
- `npm run build`: 성공
- `npm run smoke`: 45개 통과
- Chrome 조작 UI 점검: 10개 통과

계획의 코드 블록은 검증한 파일 내용 그대로다.

---

### Task 1: 의존성과 설정

**Files:**
- Modify: `package.json`(전체 교체), `astro.config.mjs`(전체 교체), `tsconfig.json`(전체 교체), `AGENTS.md`(전체 교체)
- Create: `.dev.vars.example`, `src/env.d.ts`, `.dev.vars`(예시를 복사, Git 제외)

**Interfaces:**
- Produces: React 통합(`integrations: [react()]`), JSX 설정, npm 스크립트 `hash-password`.
- Produces: `App.Locals.isAdmin: boolean`, `Cloudflare.Env.ADMIN_PASSWORD_HASH: string`, `Cloudflare.Env.SESSION_SECRET: string`

- [ ] **Step 1: 설정 파일을 바꾼다**

`package.json`(전체 교체)
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
    "smoke": "node scripts/smoke.mjs",
    "hash-password": "node scripts/hash-password.mjs"
  },
  "dependencies": {
    "@astrojs/cloudflare": "14.4.2",
    "@astrojs/react": "7.1.2",
    "@tiptap/pm": "3.32.1",
    "@tiptap/react": "3.32.1",
    "@tiptap/starter-kit": "3.32.1",
    "astro": "7.4.2",
    "pretendard": "1.3.9",
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.12",
    "@cloudflare/vitest-plugin": "1.4.9",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "typescript": "6.0.3",
    "vitest": "5.0.5",
    "wrangler": "4.154.0"
  }
}
```

`astro.config.mjs`(전체 교체)
```js
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

export default defineConfig({
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  session: false,
  integrations: [react()],
});
```

`tsconfig.json`(전체 교체)
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [
    ".astro/types.d.ts",
    "worker-configuration.d.ts",
    "src/**/*",
    "test/**/*"
  ],
  "exclude": [
    "dist"
  ],
  "compilerOptions": {
    "types": [
      "@cloudflare/vitest-plugin/types"
    ],
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

`src/env.d.ts`
```ts
declare namespace App {
  interface Locals {
    isAdmin: boolean;
  }
}

declare namespace Cloudflare {
  interface Env {
    ADMIN_PASSWORD_HASH: string;
    SESSION_SECRET: string;
  }
}
```

`.dev.vars.example`: 로컬 개발 전용 값이다. 해시는 `portfolio-dev-password`의 해시다.
```dotenv
# 로컬 개발 전용 값이다. 운영에는 쓰지 않는다.
# 복사해서 .dev.vars로 쓴다. 로컬 관리자 비밀번호: portfolio-dev-password
ADMIN_PASSWORD_HASH="pbkdf2:100000:Q6+mSERdymGzCc4YBZ8I+g==:wTElMR74HgmhQ84AQQMF+tnE05xVlc1SIXsI1jG5wJk="
SESSION_SECRET="19cb371c6f162902eb3ea81fd2c42363e3f94748a8ce42792e879a34a0df2587"
```

`AGENTS.md`(전체 교체)
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
| 로컬 비밀값 준비 | `.dev.vars.example`을 `.dev.vars`로 복사 (로컬 관리자 비밀번호: `portfolio-dev-password`) |
| 관리자 비밀번호 해시 만들기 | `npm run hash-password -- "비밀번호"` |
| 로컬 DB 마이그레이션 | `npm run db:migrate:local` |
| 로컬 예시 데이터 넣기 | `npm run db:seed:local` |
| 개발 서버 | `npm run dev` |
| 단위·DB 테스트 | `npm test` |
| 타입 검사 | `npm run check` |
| 빌드 | `npm run build` |
| 화면 점검 | `npm run smoke` (마이그레이션, 예시 데이터, `.dev.vars`를 먼저 준비한다) |

## 지킬 것

- Node.js 22.23.4 이상을 쓴다.
- npm 11은 의존성 설치 스크립트를 막고 `allow-scripts` 경고를 낸다. 그대로 둔다. `npm approve-scripts`는 실행하지 않는다.
- Cloudflare 바인딩은 `import { env } from "cloudflare:workers"`로 읽는다. `Astro.locals.runtime`은 없다.
- DB 함수는 `db: D1Database`를 인자로 받는다. 페이지에서 `env.DB`를 넘긴다.
- 테스트는 `@cloudflare/vitest-plugin`으로 Workers 런타임에서 돈다. 같은 파일 안의 테스트끼리 D1 데이터가 격리되지 않으므로, DB를 쓰는 테스트 파일은 `beforeEach`에서 `resetDb(env.DB)`를 부른다.
- Astro 7의 Rust 컴파일러는 잘못된 HTML 중첩을 고쳐 주지 않는다. `<p>` 안에 블록 요소를 넣지 않는다.
- Astro 7은 줄바꿈 사이의 공백을 지운다. 글자와 인라인 요소 사이에 공백이 필요하면 `{" "}`를 쓴다.
- 관리자 화면의 움직이는 부분은 `src/components/admin/`의 React 컴포넌트이고 `client:only="react"`로 넣는다.
- 작품 설명 HTML은 저장할 때와 화면에 낼 때 모두 `sanitizeHtml`(Workers 내장 HTMLRewriter)로 정리한다.
- 비밀값(`ADMIN_PASSWORD_HASH`, `SESSION_SECRET`)은 코드나 `wrangler.jsonc`에 쓰지 않는다. 로컬은 `.dev.vars`, 운영은 `wrangler secret put`(4단계 안내서)으로 넣는다.
- Codex 샌드박스에서는 `.git` 쓰기와 개발 서버 실행이 막혀 있다. 커밋, `npm run dev`, `npm run smoke`는 Claude가 리뷰 때 샌드박스 밖에서 한다.
- 배포(`wrangler deploy`), 로그인(`wrangler login`), `--remote` 명령, `git push`는 하지 않는다.
```

- [ ] **Step 2: 의존성을 설치하고 로컬 비밀값을 준비한다**

Run: `npm install`
Expected: 종료 코드 0. `allow-scripts` 경고는 정상이다. 이 실행에서는 네트워크가 허용되어 있다.

Run(PowerShell): `Copy-Item .dev.vars.example .dev.vars`
Expected: `.dev.vars`가 생긴다. `.gitignore`에 이미 들어 있어 Git에는 잡히지 않는다.

- [ ] **Step 3: 기존 상태가 깨지지 않았는지 확인한다**

Run: `npm test`
Expected: `Test Files  10 passed (10)`, `Tests  51 passed (51)`

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: `Complete!`

- [ ] **Step 4: 완료 기록** — `collab/HANDOFF.md` 진행 기록에 "작업 1 완료"와 바꾼 파일을 적는다. 커밋하지 않는다.

---

### Task 2: 비밀번호 해시와 세션 쿠키

**Files:**
- Create: `src/lib/auth/password.ts`, `src/lib/auth/session.ts`, `scripts/hash-password.mjs`
- Test: `test/auth/password.test.ts`, `test/auth/session.test.ts`

**Interfaces:**
- Produces: `PBKDF2_ITERATIONS = 100_000`, `hashPassword(password: string, salt?: Uint8Array<ArrayBuffer>): Promise<string>`, `verifyPassword(password: string, stored: string | undefined): Promise<boolean>`
- Produces: `SESSION_COOKIE = "session"`, `SESSION_MAX_AGE_SECONDS = 604800`, `createSessionToken(secret: string, now?: number): Promise<string>`, `verifySessionToken(secret: string | undefined, token: string | undefined, now?: number): Promise<boolean>`
- 주의: `password.ts`는 Node가 직접 불러오므로(`scripts/hash-password.mjs`) 다른 모듈을 import하지 않는다.

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/auth/password.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { PBKDF2_ITERATIONS, hashPassword, verifyPassword } from "../../src/lib/auth/password";

describe("hashPassword", () => {
  it("pbkdf2:반복횟수:솔트:해시 형식으로 만든다", async () => {
    const stored = await hashPassword("correct horse");
    const [scheme, iterations, salt, hash] = stored.split(":");
    expect(scheme).toBe("pbkdf2");
    expect(Number(iterations)).toBe(PBKDF2_ITERATIONS);
    expect(PBKDF2_ITERATIONS).toBe(100_000);
    expect(salt).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("같은 비밀번호도 솔트가 다르면 결과가 다르다", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });
});

describe("verifyPassword", () => {
  it("맞는 비밀번호만 통과한다", async () => {
    const stored = await hashPassword("비밀번호123");
    expect(await verifyPassword("비밀번호123", stored)).toBe(true);
    expect(await verifyPassword("비밀번호124", stored)).toBe(false);
  });

  it("형식이 깨졌거나 비어 있으면 실패한다", async () => {
    expect(await verifyPassword("x", undefined)).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "sha1:1:abc:def")).toBe(false);
    expect(await verifyPassword("x", "pbkdf2:999999:AAAA:AAAA")).toBe(false);
    expect(await verifyPassword("x", "pbkdf2:100000:%%%:AAAA")).toBe(false);
  });
});
```

`test/auth/session.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { SESSION_MAX_AGE_SECONDS, createSessionToken, verifySessionToken } from "../../src/lib/auth/session";

const SECRET = "test-session-secret";
const NOW = Date.UTC(2026, 9, 29, 0, 0, 0);

describe("session token", () => {
  it("만료 시각과 서명으로 이루어지고 7일 동안 유효하다", async () => {
    const token = await createSessionToken(SECRET, NOW);
    const [expires, signature] = token.split(".");
    expect(SESSION_MAX_AGE_SECONDS).toBe(604800);
    expect(Number(expires)).toBe(NOW + 604800 * 1000);
    expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await verifySessionToken(SECRET, token, NOW + 1000)).toBe(true);
  });

  it("만료되면 거부한다", async () => {
    const token = await createSessionToken(SECRET, NOW);
    expect(await verifySessionToken(SECRET, token, NOW + 604800 * 1000)).toBe(false);
  });

  it("다른 비밀값이나 바뀐 만료 시각은 거부한다", async () => {
    const token = await createSessionToken(SECRET, NOW);
    const [, signature] = token.split(".");
    expect(await verifySessionToken("other-secret", token, NOW)).toBe(false);
    expect(await verifySessionToken(SECRET, `${NOW + 999999999}.${signature}`, NOW)).toBe(false);
  });

  it("형식이 이상하거나 값이 없으면 거부한다", async () => {
    expect(await verifySessionToken(SECRET, undefined, NOW)).toBe(false);
    expect(await verifySessionToken(undefined, "1.abc", NOW)).toBe(false);
    expect(await verifySessionToken(SECRET, "abc", NOW)).toBe(false);
    expect(await verifySessionToken(SECRET, "9999999999999.%%%", NOW)).toBe(false);
    expect(await verifySessionToken(SECRET, "9999999999999.a.b", NOW)).toBe(false);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/auth/password.test.ts test/auth/session.test.ts`
Expected: FAIL. `src/lib/auth/password`와 `src/lib/auth/session`을 불러오지 못한다.

- [ ] **Step 3: 구현한다**

`src/lib/auth/password.ts`
```ts
// 이 파일은 scripts/hash-password.mjs가 Node로 직접 불러온다. 다른 모듈을 import하지 않는다.
export const PBKDF2_ITERATIONS = 100_000;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function hashPassword(
  password: string,
  salt: Uint8Array<ArrayBuffer> = crypto.getRandomValues(new Uint8Array(16)),
): Promise<string> {
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${toBase64(salt)}:${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, iterationsText, saltText, hashText, ...rest] = stored.split(":");
  if (scheme !== "pbkdf2" || !iterationsText || !saltText || !hashText || rest.length > 0) return false;
  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_ITERATIONS) return false;
  let salt: Uint8Array<ArrayBuffer>;
  let expected: Uint8Array;
  try {
    salt = fromBase64(saltText);
    expected = fromBase64(hashText);
  } catch {
    return false;
  }
  return timingSafeEqual(await derive(password, salt, iterations), expected);
}
```

`src/lib/auth/session.ts`
```ts
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createSessionToken(secret: string, now: number = Date.now()): Promise<string> {
  const expires = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(expires));
  return `${expires}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  secret: string | undefined,
  token: string | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (!secret || !token) return false;
  const [expires, signature, ...rest] = token.split(".");
  if (!expires || !signature || rest.length > 0 || !/^\d+$/.test(expires)) return false;
  if (Number(expires) <= now) return false;
  let signatureBytes: Uint8Array<ArrayBuffer>;
  try {
    signatureBytes = fromBase64Url(signature);
  } catch {
    return false;
  }
  return crypto.subtle.verify("HMAC", await hmacKey(secret), signatureBytes, encoder.encode(expires));
}
```

`scripts/hash-password.mjs`
```js
// 사용법: npm run hash-password -- "비밀번호"
// 결과를 .dev.vars 또는 `wrangler secret put ADMIN_PASSWORD_HASH`에 넣는다.
import { hashPassword } from "../src/lib/auth/password.ts";

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('8자 이상의 비밀번호를 넣어 주세요. 예: npm run hash-password -- "비밀번호"');
  process.exit(1);
}
console.log(await hashPassword(password));
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/auth/password.test.ts test/auth/session.test.ts`
Expected: `Tests  8 passed (8)`

Run: `npm run hash-password -- short`
Expected: `8자 이상의 비밀번호를 넣어 주세요.`로 시작하는 줄이 나오고 종료 코드 1

Run: `npm run hash-password -- "portfolio-dev-password"`
Expected: `pbkdf2:100000:`로 시작하는 한 줄(솔트가 무작위라 실행할 때마다 다름)

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 2 완료". 커밋하지 않는다.

---

### Task 3: 요청 검사와 로그인 잠금

**Files:**
- Create: `src/lib/auth/request.ts`, `src/lib/auth/lockout.ts`
- Test: `test/auth/request.test.ts`, `test/auth/lockout.test.ts`

**Interfaces:**
- Produces: `isSameOrigin(request: Request): boolean`, `clientIp(request: Request): string`, `isAdminPath(pathname: string): boolean`
- Produces: `MAX_FAILURES = 5`, `LOCK_MINUTES = 15`, `LockStatus { locked: boolean; lockedUntil: string | null }`, `getLockStatus(db, ip, now: Date)`, `recordFailure(db, ip, now: Date)`, `clearFailures(db, ip)`
- 규칙: 잠금이 풀린 뒤 다시 틀리면 1부터 다시 센다.

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/auth/request.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { clientIp, isAdminPath, isSameOrigin } from "../../src/lib/auth/request";

const post = (headers: Record<string, string>) =>
  new Request("https://portfolio.example.workers.dev/api/admin/works", { method: "POST", headers });

describe("isSameOrigin", () => {
  it("Origin이 사이트 자신일 때만 true", () => {
    expect(isSameOrigin(post({ Origin: "https://portfolio.example.workers.dev" }))).toBe(true);
    expect(isSameOrigin(post({ Origin: "https://evil.example.com" }))).toBe(false);
    expect(isSameOrigin(post({}))).toBe(false);
  });
});

describe("clientIp", () => {
  it("CF-Connecting-IP를 쓰고, 없으면 local", () => {
    expect(clientIp(post({ "CF-Connecting-IP": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(post({}))).toBe("local");
  });
});

describe("isAdminPath", () => {
  it("관리자 화면과 관리자 API만 해당한다", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/login")).toBe(true);
    expect(isAdminPath("/api/admin/works")).toBe(true);
    expect(isAdminPath("/administrator")).toBe(false);
    expect(isAdminPath("/works/admin")).toBe(false);
  });
});
```

`test/auth/lockout.test.ts`
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { clearFailures, getLockStatus, recordFailure } from "../../src/lib/auth/lockout";
import { resetDb } from "../helpers/db";

const IP = "203.0.113.7";
const NOW = new Date("2026-10-29T00:00:00.000Z");
const later = (minutes: number) => new Date(NOW.getTime() + minutes * 60 * 1000);

beforeEach(async () => {
  await resetDb(env.DB);
});

describe("로그인 잠금", () => {
  it("4번 틀려도 잠기지 않고 5번째에 15분 잠긴다", async () => {
    for (let i = 0; i < 4; i += 1) {
      expect((await recordFailure(env.DB, IP, NOW)).locked).toBe(false);
    }
    const fifth = await recordFailure(env.DB, IP, NOW);
    expect(fifth).toEqual({ locked: true, lockedUntil: "2026-10-29T00:15:00.000Z" });
    expect((await getLockStatus(env.DB, IP, later(14))).locked).toBe(true);
  });

  it("15분이 지나면 풀리고, 다시 틀리면 처음부터 센다", async () => {
    for (let i = 0; i < 5; i += 1) await recordFailure(env.DB, IP, NOW);
    expect(await getLockStatus(env.DB, IP, later(15))).toEqual({ locked: false, lockedUntil: null });
    for (let i = 0; i < 4; i += 1) {
      expect((await recordFailure(env.DB, IP, later(16))).locked).toBe(false);
    }
  });

  it("성공하면 실패 횟수를 지운다", async () => {
    for (let i = 0; i < 4; i += 1) await recordFailure(env.DB, IP, NOW);
    await clearFailures(env.DB, IP);
    expect((await recordFailure(env.DB, IP, NOW)).locked).toBe(false);
    const row = await env.DB.prepare("SELECT failed_count FROM login_attempts WHERE ip = ?").bind(IP).first();
    expect(row).toEqual({ failed_count: 1 });
  });

  it("IP마다 따로 센다", async () => {
    for (let i = 0; i < 5; i += 1) await recordFailure(env.DB, IP, NOW);
    expect((await getLockStatus(env.DB, "198.51.100.1", NOW)).locked).toBe(false);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/auth/request.test.ts test/auth/lockout.test.ts`
Expected: FAIL. 두 모듈을 불러오지 못한다.

- [ ] **Step 3: 구현한다**

`src/lib/auth/request.ts`
```ts
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export function clientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "local";
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
}
```

`src/lib/auth/lockout.ts`
```ts
export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;

export interface LockStatus {
  locked: boolean;
  lockedUntil: string | null;
}

interface AttemptRow {
  ip: string;
  failed_count: number;
  locked_until: string | null;
}

function isActiveLock(lockedUntil: string | null, now: Date): boolean {
  return lockedUntil !== null && lockedUntil > now.toISOString();
}

export async function getLockStatus(db: D1Database, ip: string, now: Date): Promise<LockStatus> {
  const row = await db.prepare("SELECT * FROM login_attempts WHERE ip = ?").bind(ip).first<AttemptRow>();
  const lockedUntil = row?.locked_until ?? null;
  return isActiveLock(lockedUntil, now) ? { locked: true, lockedUntil } : { locked: false, lockedUntil: null };
}

export async function recordFailure(db: D1Database, ip: string, now: Date): Promise<LockStatus> {
  const row = await db.prepare("SELECT * FROM login_attempts WHERE ip = ?").bind(ip).first<AttemptRow>();
  const lockExpired = row?.locked_until != null && !isActiveLock(row.locked_until, now);
  const failedCount = (row && !lockExpired ? row.failed_count : 0) + 1;
  const lockedUntil =
    failedCount >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000).toISOString() : null;
  await db
    .prepare(
      `INSERT INTO login_attempts (ip, failed_count, locked_until, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(ip) DO UPDATE SET failed_count = excluded.failed_count, locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
    )
    .bind(ip, failedCount, lockedUntil, now.toISOString())
    .run();
  return { locked: lockedUntil !== null, lockedUntil };
}

export async function clearFailures(db: D1Database, ip: string): Promise<void> {
  await db.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/auth/request.test.ts test/auth/lockout.test.ts`
Expected: `Tests  7 passed (7)`

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 3 완료". 커밋하지 않는다.

---

### Task 4: 설명 서식 정리

**Files:**
- Create: `src/lib/html/sanitize.ts`
- Test: `test/html/sanitize.test.ts`

**Interfaces:**
- Produces: `sanitizeHtml(html: string): Promise<string>`. Workers 런타임의 전역 `HTMLRewriter`를 쓴다. 테스트도 Workers 런타임에서 돌므로 그대로 동작한다.

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/html/sanitize.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "../../src/lib/html/sanitize";

describe("sanitizeHtml", () => {
  it("허용한 서식은 그대로 둔다", async () => {
    const html = "<h2>제목</h2><p><strong>굵게</strong> <em>기울임</em> <u>밑줄</u> <s>취소</s></p><ul><li>하나</li></ul><ol><li>둘</li></ol><blockquote>인용</blockquote><pre><code>코드</code></pre><p>줄<br>바꿈</p><hr>";
    expect(await sanitizeHtml(html)).toBe(html);
  });

  it("script와 style은 내용까지 지운다", async () => {
    expect(await sanitizeHtml("<p>안녕</p><script>alert(1)</script><style>p{color:red}</style>")).toBe("<p>안녕</p>");
  });

  it("허용하지 않은 태그는 벗기고 글자는 남긴다", async () => {
    expect(await sanitizeHtml('<div><span>글자</span><img src="x.png"><h1>큰 제목</h1></div>')).toBe("글자큰 제목");
  });

  it("모든 속성을 지운다", async () => {
    expect(await sanitizeHtml('<p class="x" style="color:red" onclick="alert(1)">글</p>')).toBe("<p>글</p>");
  });

  it("링크는 http, https, mailto만 남기고 새 탭 속성을 붙인다", async () => {
    expect(await sanitizeHtml('<a href="https://example.com" title="t">사이트</a>')).toBe(
      '<a href="https://example.com" rel="noopener noreferrer" target="_blank">사이트</a>',
    );
    expect(await sanitizeHtml('<a href="mailto:a@b.c">메일</a>')).toBe(
      '<a href="mailto:a@b.c" rel="noopener noreferrer" target="_blank">메일</a>',
    );
    expect(await sanitizeHtml('<a href="javascript:alert(1)">위험</a>')).toBe("<a>위험</a>");
    expect(await sanitizeHtml('<a href="/works/x">상대</a>')).toBe("<a>상대</a>");
  });

  it("HTML 주석을 지운다", async () => {
    expect(await sanitizeHtml("<p>보임<!-- 숨김 --></p>")).toBe("<p>보임</p>");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/html/sanitize.test.ts`
Expected: FAIL. `src/lib/html/sanitize`를 불러오지 못한다.

- [ ] **Step 3: 구현한다**

`src/lib/html/sanitize.ts`
```ts
// 작품 설명 HTML을 허용 목록 방식으로 정리한다(스펙 5.3). Workers에 내장된 HTMLRewriter를 쓴다.
const ALLOWED_TAGS = new Set(["p", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li", "a", "blockquote", "code", "pre", "br", "hr"]);
const DROP_WITH_CONTENT = new Set(["script", "style"]);
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function isSafeHref(href: string): boolean {
  try {
    return SAFE_PROTOCOLS.has(new URL(href.trim()).protocol);
  } catch {
    return false;
  }
}

export async function sanitizeHtml(html: string): Promise<string> {
  const rewriter = new HTMLRewriter()
    .on("*", {
      element(element) {
        const tag = element.tagName.toLowerCase();
        if (DROP_WITH_CONTENT.has(tag)) {
          element.remove();
          return;
        }
        if (!ALLOWED_TAGS.has(tag)) {
          element.removeAndKeepContent();
          return;
        }
        // DOM 타입과 Workers 타입의 Element가 겹쳐서, Workers의 실제 모양([이름, 값] 반복자)으로 지정한다.
        const names = Array.from(element.attributes as unknown as Iterable<[string, string]>, ([name]) => name);
        for (const name of names) {
          if (!(tag === "a" && name === "href")) element.removeAttribute(name);
        }
        if (tag === "a") {
          const href = element.getAttribute("href");
          if (href !== null && isSafeHref(href)) {
            element.setAttribute("rel", "noopener noreferrer");
            element.setAttribute("target", "_blank");
          } else {
            element.removeAttribute("href");
          }
        }
      },
    })
    .onDocument({
      comments(comment) {
        comment.remove();
      },
    });
  return rewriter.transform(new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })).text();
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/html/sanitize.test.ts`
Expected: `Tests  6 passed (6)`

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 4 완료". 커밋하지 않는다.

---

### Task 5: 작품 주소(slug)

**Files:**
- Create: `src/lib/works/slug.ts`
- Test: `test/works/slug.test.ts`

**Interfaces:**
- Produces: `SLUG_MAX = 60`, `slugify(title: string): string`(남는 글자가 없으면 `work`), `isValidSlug(slug: string): boolean`, `isSlugTaken(db, slug, excludeId?: string | null): Promise<boolean>`, `uniqueSlug(db, base, excludeId?: string | null): Promise<string>`

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/works/slug.test.ts`
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { isValidSlug, slugify, uniqueSlug } from "../../src/lib/works/slug";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";

describe("slugify", () => {
  it("한글을 그대로 두고 띄어쓰기를 하이픈으로 바꾼다", () => {
    expect(slugify("캠퍼스 분실물 지도")).toBe("캠퍼스-분실물-지도");
  });

  it("특수문자를 지우고 영문은 소문자로 만든다", () => {
    expect(slugify("  Hello, World! (2025) ")).toBe("hello-world-2025");
    expect(slugify("A_B -- C")).toBe("a-b-c");
  });

  it("남는 글자가 없으면 work", () => {
    expect(slugify("!!!")).toBe("work");
  });

  it("60자까지만 쓴다", () => {
    expect(Array.from(slugify("가".repeat(80)))).toHaveLength(60);
  });
});

describe("isValidSlug", () => {
  it("소문자, 한글, 숫자와 하이픈만 허용한다", () => {
    expect(isValidSlug("캠퍼스-분실물-지도")).toBe(true);
    expect(isValidSlug("brand-identity-2")).toBe(true);
    expect(isValidSlug("Brand")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("-a")).toBe(false);
    expect(isValidSlug("a/b")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  it("겹치면 -2, -3을 붙인다", async () => {
    expect(await uniqueSlug(env.DB, "작품")).toBe("작품");
    await insertWorkRow(env.DB, makeWorkRow({ id: "a", slug: "작품" }));
    expect(await uniqueSlug(env.DB, "작품")).toBe("작품-2");
    await insertWorkRow(env.DB, makeWorkRow({ id: "b", slug: "작품-2" }));
    expect(await uniqueSlug(env.DB, "작품")).toBe("작품-3");
  });

  it("자기 자신은 겹친 것으로 보지 않는다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ id: "a", slug: "작품" }));
    expect(await uniqueSlug(env.DB, "작품", "a")).toBe("작품");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/works/slug.test.ts`
Expected: FAIL. `src/lib/works/slug`를 불러오지 못한다.

- [ ] **Step 3: 구현한다**

`src/lib/works/slug.ts`
```ts
export const SLUG_MAX = 60;
const SLUG_PATTERN = /^[\p{Ll}\p{Lo}\p{Nd}]+(?:-[\p{Ll}\p{Lo}\p{Nd}]+)*$/u;

export function slugify(title: string): string {
  const base = title
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const cut = Array.from(base).slice(0, SLUG_MAX).join("").replace(/-+$/, "");
  return cut === "" ? "work" : cut;
}

export function isValidSlug(slug: string): boolean {
  return Array.from(slug).length <= SLUG_MAX && SLUG_PATTERN.test(slug);
}

export async function isSlugTaken(db: D1Database, slug: string, excludeId: string | null = null): Promise<boolean> {
  const row = await db
    .prepare("SELECT id FROM works WHERE slug = ? AND id != ?")
    .bind(slug, excludeId ?? "")
    .first();
  return row !== null;
}

export async function uniqueSlug(db: D1Database, base: string, excludeId: string | null = null): Promise<string> {
  for (let n = 1; ; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!(await isSlugTaken(db, candidate, excludeId))) return candidate;
  }
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/works/slug.test.ts`
Expected: `Tests  7 passed (7)`

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 5 완료". 커밋하지 않는다.

---

### Task 6: 입력 검사(작품, 자기소개)

**Files:**
- Create: `src/lib/validate/common.ts`, `src/lib/validate/work.ts`, `src/lib/validate/profile.ts`
- Test: `test/validate/work.test.ts`, `test/validate/profile.test.ts`

**Interfaces:**
- Consumes: `isHttpUrl`(1단계 `src/lib/db/rows.ts`), `stripHtml`, `SUMMARY_MAX`(1단계 `summary.ts`), `isValidSlug`(작업 5)
- Produces: `FieldErrors = Record<string, string>`, `Validation<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors }`, `URL_MESSAGE`, `text`, `nullable`, `charCount`, `tagList`, `isIsoDate`, `record`
- Produces: `WorkInput`(폼 값, 모두 문자열·배열), `WorkDraft`(검사를 통과한 값), `EMPTY_WORK_INPUT`, `workToInput(work: Work): WorkInput`, `validateWorkInput(raw: unknown): Validation<WorkDraft>`, `LINKS_MAX = 10`
- Produces: `ProfileInput`, `ProfileDraft`, `profileToInput(profile: Profile): ProfileInput`, `validateProfileInput(raw: unknown): Validation<ProfileDraft>`, `PROFILE_LINKS_MAX = 10`
- 같은 검사 코드를 서버(API)와 브라우저(React 폼) 양쪽에서 쓴다. 오류 키는 칸 이름이고, 링크 오류는 `links.0`처럼 줄 번호를 붙인다.

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/validate/work.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { EMPTY_WORK_INPUT, validateWorkInput, workToInput, type WorkInput } from "../../src/lib/validate/work";
import { makeWork } from "../helpers/factories";

const valid: WorkInput = {
  ...EMPTY_WORK_INPUT,
  title: "  캠퍼스 분실물 지도 ",
  descriptionHtml: "<p>설명</p>",
  fields: ["개발", " 개발 ", "기획", ""],
};

function errorsOf(input: Partial<WorkInput> | unknown): Record<string, string> {
  const result = validateWorkInput(typeof input === "object" && input !== null ? { ...valid, ...input } : input);
  return result.ok ? {} : result.errors;
}

describe("validateWorkInput", () => {
  it("필수 항목만 있어도 통과하고 값을 정리한다", () => {
    const result = validateWorkInput(valid);
    expect(result).toEqual({
      ok: true,
      value: {
        title: "캠퍼스 분실물 지도",
        slug: null,
        summary: null,
        descriptionHtml: "<p>설명</p>",
        fields: ["개발", "기획"],
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
      },
    });
  });

  it("필수 항목(작품명, 분야, 설명)이 없으면 한국어 오류를 준다", () => {
    expect(errorsOf({ title: " ", fields: [], descriptionHtml: "<p> </p>" })).toEqual({
      title: "작품명을 입력해 주세요.",
      fields: "분야를 하나 이상 입력해 주세요.",
      descriptionHtml: "작품 설명을 입력해 주세요.",
    });
    expect(errorsOf(null)).toMatchObject({ title: "작품명을 입력해 주세요." });
  });

  it("글자 수 제한을 지킨다", () => {
    expect(errorsOf({ title: "가".repeat(101) })).toEqual({ title: "작품명은 100자까지 쓸 수 있어요." });
    expect(errorsOf({ summary: "가".repeat(121) })).toEqual({ summary: "한 줄 요약은 120자까지 쓸 수 있어요." });
    expect(errorsOf({ fields: ["가".repeat(31)] })).toEqual({ fields: "분야 이름은 30자까지 쓸 수 있어요." });
  });

  it("날짜 형식과 기간 순서를 검사한다", () => {
    expect(errorsOf({ participatedOn: "2025-02-30" })).toEqual({ participatedOn: "날짜 형식이 올바르지 않아요." });
    expect(errorsOf({ periodStart: "2025-03-01", periodEnd: "2025-02-01" })).toEqual({ periodEnd: "종료일이 시작일보다 빨라요." });
    expect(validateWorkInput({ ...valid, periodStart: "2025-03-01", periodEnd: "2025-03-01" }).ok).toBe(true);
  });

  it("팀이면 인원 수를 2 이상 숫자로 받고, 개인이면 인원 수를 버린다", () => {
    expect(errorsOf({ teamType: "team", teamSize: "1" })).toEqual({ teamSize: "팀 인원은 2명 이상의 숫자로 입력해 주세요." });
    const team = validateWorkInput({ ...valid, teamType: "team", teamSize: "4" });
    expect(team.ok && team.value.teamSize).toBe(4);
    const solo = validateWorkInput({ ...valid, teamType: "solo", teamSize: "4" });
    expect(solo.ok && [solo.value.teamType, solo.value.teamSize]).toEqual(["solo", null]);
  });

  it("링크는 종류와 http(s) 주소를 검사하고 빈 줄은 건너뛴다", () => {
    expect(
      errorsOf({
        links: [
          { kind: "github", label: "코드", url: "https://github.com/x" },
          { kind: "github", label: "", url: "" },
          { kind: "demo", label: "데모", url: "javascript:alert(1)" },
          { kind: "unknown", label: "x", url: "https://x.com" },
        ],
      }),
    ).toEqual({ "links.2": "주소는 http:// 또는 https://로 시작해야 해요.", "links.3": "링크 종류를 골라 주세요." });
    const ok = validateWorkInput({ ...valid, links: [{ kind: "video", label: " ", url: "https://youtu.be/aqz-KE-bpKQ" }] });
    expect(ok.ok && ok.value.links).toEqual([{ kind: "video", label: "", url: "https://youtu.be/aqz-KE-bpKQ" }]);
  });

  it("주소(slug)는 소문자로 바꾸고 형식을 검사한다", () => {
    const ok = validateWorkInput({ ...valid, slug: " Brand-Identity " });
    expect(ok.ok && ok.value.slug).toBe("brand-identity");
    expect(errorsOf({ slug: "a/b" })).toEqual({ slug: "주소에는 소문자, 한글, 숫자와 하이픈(-)만 쓸 수 있어요." });
  });
});

describe("workToInput", () => {
  it("작품을 폼 값으로 바꾼다", () => {
    const input = workToInput(makeWork({ title: "제목", teamType: "team", teamSize: 3, award: null }));
    expect(input).toMatchObject({ title: "제목", teamType: "team", teamSize: "3", award: "" });
  });
});
```

`test/validate/profile.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { validateProfileInput } from "../../src/lib/validate/profile";

const valid = { name: " 홍길동 ", headline: "", bio: "", email: "", githubUrl: "", links: [] };

describe("validateProfileInput", () => {
  it("이름만 있어도 통과하고 빈 값은 null로 둔다", () => {
    expect(validateProfileInput(valid)).toEqual({
      ok: true,
      value: { name: "홍길동", headline: null, bio: null, email: null, githubUrl: null, links: [] },
    });
  });

  it("이름이 없거나 형식이 틀리면 오류를 준다", () => {
    const result = validateProfileInput({
      ...valid,
      name: "",
      email: "not-an-email",
      githubUrl: "github.com/me",
      links: [{ label: "", url: "https://x.com" }, { label: "블로그", url: "ftp://x" }, { label: "", url: "" }],
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "이름을 입력해 주세요.",
        email: "이메일 형식이 올바르지 않아요.",
        githubUrl: "주소는 http:// 또는 https://로 시작해야 해요.",
        "links.0": "링크 이름을 입력해 주세요.",
        "links.1": "주소는 http:// 또는 https://로 시작해야 해요.",
      },
    });
  });

  it("자기소개 글은 줄바꿈을 지키고 1000자까지 받는다", () => {
    const ok = validateProfileInput({ ...valid, bio: "첫 줄\n둘째 줄" });
    expect(ok.ok && ok.value.bio).toBe("첫 줄\n둘째 줄");
    expect(validateProfileInput({ ...valid, bio: "가".repeat(1001) })).toEqual({
      ok: false,
      errors: { bio: "자기소개는 1000자까지 쓸 수 있어요." },
    });
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/validate/work.test.ts test/validate/profile.test.ts`
Expected: FAIL. `src/lib/validate/*`를 불러오지 못한다.

- [ ] **Step 3: 구현한다**

`src/lib/validate/common.ts`
```ts
export type FieldErrors = Record<string, string>;
export type Validation<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export const URL_MESSAGE = "주소는 http:// 또는 https://로 시작해야 해요.";

export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function nullable(value: string): string | null {
  return value === "" ? null : value;
}

export function charCount(value: string): number {
  return Array.from(value).length;
}

export function tagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(text).filter((item) => item !== ""))];
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
```

`src/lib/validate/work.ts`
```ts
import { isHttpUrl } from "../db/rows";
import { LINK_KINDS, type LinkKind, type TeamType, type Work, type WorkLink } from "../types";
import { isValidSlug } from "../works/slug";
import { SUMMARY_MAX, stripHtml } from "../works/summary";
import { URL_MESSAGE, charCount, isIsoDate, nullable, record, tagList, text, type FieldErrors, type Validation } from "./common";

export const TITLE_MAX = 100;
export const TAG_MAX = 30;
export const FIELDS_MAX = 10;
export const TECHS_MAX = 20;
export const LINKS_MAX = 10;
export const LINK_LABEL_MAX = 50;
export const DESCRIPTION_MAX = 100_000;

export interface WorkInput {
  title: string;
  slug: string;
  summary: string;
  descriptionHtml: string;
  fields: string[];
  techs: string[];
  links: WorkLink[];
  competition: string;
  organizer: string;
  participatedOn: string;
  periodStart: string;
  periodEnd: string;
  award: string;
  teamType: "" | TeamType;
  teamSize: string;
  role: string;
}

export interface WorkDraft {
  title: string;
  slug: string | null;
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
}

export const EMPTY_WORK_INPUT: WorkInput = {
  title: "",
  slug: "",
  summary: "",
  descriptionHtml: "",
  fields: [],
  techs: [],
  links: [],
  competition: "",
  organizer: "",
  participatedOn: "",
  periodStart: "",
  periodEnd: "",
  award: "",
  teamType: "",
  teamSize: "",
  role: "",
};

export function workToInput(work: Work): WorkInput {
  return {
    title: work.title,
    slug: work.slug,
    summary: work.summary ?? "",
    descriptionHtml: work.descriptionHtml,
    fields: work.fields,
    techs: work.techs,
    links: work.links,
    competition: work.competition ?? "",
    organizer: work.organizer ?? "",
    participatedOn: work.participatedOn ?? "",
    periodStart: work.periodStart ?? "",
    periodEnd: work.periodEnd ?? "",
    award: work.award ?? "",
    teamType: work.teamType ?? "",
    teamSize: work.teamSize === null ? "" : String(work.teamSize),
    role: work.role ?? "",
  };
}

function limited(errors: FieldErrors, key: string, value: string, max: number, message: string): string | null {
  if (charCount(value) > max) errors[key] = message;
  return nullable(value);
}

export function validateWorkInput(raw: unknown): Validation<WorkDraft> {
  const input = record(raw);
  const errors: FieldErrors = {};

  const title = text(input.title);
  if (title === "") errors.title = "작품명을 입력해 주세요.";
  else if (charCount(title) > TITLE_MAX) errors.title = "작품명은 100자까지 쓸 수 있어요.";

  const slugText = text(input.slug).toLowerCase();
  if (slugText !== "" && !isValidSlug(slugText)) {
    errors.slug = "주소에는 소문자, 한글, 숫자와 하이픈(-)만 쓸 수 있어요.";
  }

  const descriptionHtml = typeof input.descriptionHtml === "string" ? input.descriptionHtml : "";
  if (stripHtml(descriptionHtml) === "") errors.descriptionHtml = "작품 설명을 입력해 주세요.";
  else if (descriptionHtml.length > DESCRIPTION_MAX) errors.descriptionHtml = "작품 설명이 너무 길어요.";

  const fields = tagList(input.fields);
  if (fields.length === 0) errors.fields = "분야를 하나 이상 입력해 주세요.";
  else if (fields.length > FIELDS_MAX) errors.fields = "분야는 10개까지 넣을 수 있어요.";
  else if (fields.some((field) => charCount(field) > TAG_MAX)) errors.fields = "분야 이름은 30자까지 쓸 수 있어요.";

  const techs = tagList(input.techs);
  if (techs.length > TECHS_MAX) errors.techs = "사용 기술은 20개까지 넣을 수 있어요.";
  else if (techs.some((tech) => charCount(tech) > TAG_MAX)) errors.techs = "기술 이름은 30자까지 쓸 수 있어요.";

  const dates: Record<"participatedOn" | "periodStart" | "periodEnd", string | null> = {
    participatedOn: null,
    periodStart: null,
    periodEnd: null,
  };
  for (const key of ["participatedOn", "periodStart", "periodEnd"] as const) {
    const value = text(input[key]);
    if (value !== "" && !isIsoDate(value)) errors[key] = "날짜 형식이 올바르지 않아요.";
    dates[key] = nullable(value);
  }
  if (!errors.periodStart && !errors.periodEnd && dates.periodStart && dates.periodEnd && dates.periodEnd < dates.periodStart) {
    errors.periodEnd = "종료일이 시작일보다 빨라요.";
  }

  const teamTypeText = text(input.teamType);
  const teamType: TeamType | null = teamTypeText === "solo" || teamTypeText === "team" ? teamTypeText : null;
  let teamSize: number | null = null;
  if (teamType === "team") {
    const sizeText = text(input.teamSize);
    if (sizeText !== "") {
      const size = Number(sizeText);
      if (!Number.isInteger(size) || size < 2 || size > 999) errors.teamSize = "팀 인원은 2명 이상의 숫자로 입력해 주세요.";
      else teamSize = size;
    }
  }

  const links: WorkLink[] = [];
  const rawLinks = Array.isArray(input.links) ? input.links : [];
  rawLinks.forEach((item, index) => {
    const link = record(item);
    const label = text(link.label);
    const url = text(link.url);
    if (label === "" && url === "") return;
    const key = `links.${index}`;
    if (!LINK_KINDS.includes(link.kind as LinkKind)) errors[key] = "링크 종류를 골라 주세요.";
    else if (!isHttpUrl(url)) errors[key] = URL_MESSAGE;
    else if (charCount(label) > LINK_LABEL_MAX) errors[key] = "링크 이름은 50자까지 쓸 수 있어요.";
    else links.push({ kind: link.kind as LinkKind, label, url });
  });
  if (links.length > LINKS_MAX) errors.links = "링크는 10개까지 넣을 수 있어요.";

  const summary = limited(errors, "summary", text(input.summary), SUMMARY_MAX, "한 줄 요약은 120자까지 쓸 수 있어요.");
  const competition = limited(errors, "competition", text(input.competition), 100, "대회 이름은 100자까지 쓸 수 있어요.");
  const organizer = limited(errors, "organizer", text(input.organizer), 100, "주최 기관은 100자까지 쓸 수 있어요.");
  const award = limited(errors, "award", text(input.award), 50, "수상 내용은 50자까지 쓸 수 있어요.");
  const role = limited(errors, "role", text(input.role), 200, "내 역할은 200자까지 쓸 수 있어요.");

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      slug: nullable(slugText),
      summary,
      descriptionHtml,
      fields,
      techs,
      links,
      competition,
      organizer,
      ...dates,
      award,
      teamType,
      teamSize,
      role,
    },
  };
}
```

`src/lib/validate/profile.ts`
```ts
import { isHttpUrl } from "../db/rows";
import type { Profile, ProfileLink } from "../types";
import { URL_MESSAGE, charCount, nullable, record, text, type FieldErrors, type Validation } from "./common";

export const PROFILE_LINKS_MAX = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ProfileInput {
  name: string;
  headline: string;
  bio: string;
  email: string;
  githubUrl: string;
  links: ProfileLink[];
}

export interface ProfileDraft {
  name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  githubUrl: string | null;
  links: ProfileLink[];
}

export function profileToInput(profile: Profile): ProfileInput {
  return {
    name: profile.name,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    email: profile.email ?? "",
    githubUrl: profile.githubUrl ?? "",
    links: profile.links,
  };
}

export function validateProfileInput(raw: unknown): Validation<ProfileDraft> {
  const input = record(raw);
  const errors: FieldErrors = {};

  const name = text(input.name);
  if (name === "") errors.name = "이름을 입력해 주세요.";
  else if (charCount(name) > 50) errors.name = "이름은 50자까지 쓸 수 있어요.";

  const headline = text(input.headline);
  if (charCount(headline) > 100) errors.headline = "한 줄 소개는 100자까지 쓸 수 있어요.";

  const bio = typeof input.bio === "string" ? input.bio.trim() : "";
  if (charCount(bio) > 1000) errors.bio = "자기소개는 1000자까지 쓸 수 있어요.";

  const email = text(input.email);
  if (email !== "" && (!EMAIL_PATTERN.test(email) || charCount(email) > 100)) errors.email = "이메일 형식이 올바르지 않아요.";

  const githubUrl = text(input.githubUrl);
  if (githubUrl !== "" && !isHttpUrl(githubUrl)) errors.githubUrl = URL_MESSAGE;

  const links: ProfileLink[] = [];
  const rawLinks = Array.isArray(input.links) ? input.links : [];
  rawLinks.forEach((item, index) => {
    const link = record(item);
    const label = text(link.label);
    const url = text(link.url);
    if (label === "" && url === "") return;
    const key = `links.${index}`;
    if (label === "") errors[key] = "링크 이름을 입력해 주세요.";
    else if (charCount(label) > 30) errors[key] = "링크 이름은 30자까지 쓸 수 있어요.";
    else if (!isHttpUrl(url)) errors[key] = URL_MESSAGE;
    else links.push({ label, url });
  });
  if (links.length > PROFILE_LINKS_MAX) errors.links = "링크는 10개까지 넣을 수 있어요.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name, headline: nullable(headline), bio: nullable(bio), email: nullable(email), githubUrl: nullable(githubUrl), links },
  };
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/validate/work.test.ts test/validate/profile.test.ts`
Expected: `Tests  11 passed (11)`

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 6 완료". 커밋하지 않는다.

---

### Task 7: 관리자용 DB 함수

**Files:**
- Create: `src/lib/db/adminWorks.ts`
- Modify: `src/lib/db/profile.ts`(전체 교체, `updateProfile` 추가)
- Test: `test/db/adminWorks.test.ts`, `test/db/profile.test.ts`(전체 교체, 테스트 1개 추가)

**Interfaces:**
- Consumes: `rowToWork`, `WorkRow`(1단계), `sortWorks`(1단계), `isSlugTaken`, `slugify`, `uniqueSlug`(작업 5), `WorkDraft`(작업 6), `ProfileDraft`(작업 6)
- Produces: `SaveResult = { ok: true; work: Work } | { ok: false; status: 400 | 404; errors: Record<string, string> }`, `SLUG_TAKEN_MESSAGE = "이미 쓰고 있는 주소예요."`
- Produces: `listAllWorks(db)`, `getWorkById(db, id)`, `getWorkBySlug(db, slug)`(비공개 포함), `createWork(db, draft, now)`(비공개, id는 `crypto.randomUUID()`), `updateWork(db, id, draft, now)`(`draft.slug`가 null이면 기존 주소 유지), `setWorkFlags(db, id, { isPublic?, isFeatured? }, now)`, `deleteWork(db, id)`(파일 기록도 함께 삭제), `countFilesByWork(db): Promise<Map<string, number>>`, `listTagSuggestions(db): Promise<{ fields: string[]; techs: string[] }>`
- Produces: `updateProfile(db: D1Database, draft: ProfileDraft, now: Date): Promise<Profile>`

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/db/adminWorks.test.ts`
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import {
  countFilesByWork,
  createWork,
  deleteWork,
  getWorkBySlug,
  listAllWorks,
  listTagSuggestions,
  setWorkFlags,
  updateWork,
} from "../../src/lib/db/adminWorks";
import type { WorkDraft } from "../../src/lib/validate/work";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";

const NOW = new Date("2026-10-29T00:00:00.000Z");
const LATER = new Date("2026-10-30T00:00:00.000Z");

const draft = (overrides: Partial<WorkDraft> = {}): WorkDraft => ({
  title: "새 작품",
  slug: null,
  summary: null,
  descriptionHtml: "<p>설명</p>",
  fields: ["개발"],
  techs: ["Astro"],
  links: [{ kind: "github", label: "코드", url: "https://github.com/x" }],
  competition: null,
  organizer: null,
  participatedOn: "2026-10-01",
  periodStart: null,
  periodEnd: null,
  award: null,
  teamType: "team",
  teamSize: 3,
  role: "개발",
  ...overrides,
});

beforeEach(async () => {
  await resetDb(env.DB);
});

describe("createWork", () => {
  it("비공개로 저장하고 작품명으로 주소를 만든다", async () => {
    const result = await createWork(env.DB, draft(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.work).toMatchObject({
      slug: "새-작품",
      title: "새 작품",
      isPublic: false,
      isFeatured: false,
      techs: ["Astro"],
      teamSize: 3,
      createdAt: "2026-10-29T00:00:00.000Z",
    });
    expect(result.work.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("같은 작품명이면 -2를 붙이고, 직접 적은 주소가 겹치면 오류", async () => {
    await createWork(env.DB, draft(), NOW);
    const second = await createWork(env.DB, draft(), NOW);
    expect(second.ok && second.work.slug).toBe("새-작품-2");
    expect(await createWork(env.DB, draft({ slug: "새-작품" }), NOW)).toEqual({
      ok: false,
      status: 400,
      errors: { slug: "이미 쓰고 있는 주소예요." },
    });
  });
});

describe("updateWork", () => {
  it("내용과 주소를 바꾸고 수정 시각을 남긴다", async () => {
    const created = await createWork(env.DB, draft(), NOW);
    if (!created.ok) throw new Error("create failed");
    const updated = await updateWork(env.DB, created.work.id, draft({ title: "바뀐 제목", slug: "바뀐-주소", techs: [] }), LATER);
    expect(updated.ok && updated.work).toMatchObject({
      title: "바뀐 제목",
      slug: "바뀐-주소",
      techs: [],
      updatedAt: "2026-10-30T00:00:00.000Z",
      createdAt: "2026-10-29T00:00:00.000Z",
    });
  });

  it("주소를 비우면 기존 주소를 유지하고, 다른 작품 주소와 겹치면 오류", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ id: "other", slug: "남의-주소" }));
    const created = await createWork(env.DB, draft(), NOW);
    if (!created.ok) throw new Error("create failed");
    const kept = await updateWork(env.DB, created.work.id, draft({ title: "제목만 바꿈" }), LATER);
    expect(kept.ok && kept.work.slug).toBe("새-작품");
    expect(await updateWork(env.DB, created.work.id, draft({ slug: "남의-주소" }), LATER)).toEqual({
      ok: false,
      status: 400,
      errors: { slug: "이미 쓰고 있는 주소예요." },
    });
  });

  it("없는 작품이면 404", async () => {
    expect(await updateWork(env.DB, "none", draft(), LATER)).toEqual({ ok: false, status: 404, errors: {} });
  });
});

describe("setWorkFlags / deleteWork", () => {
  it("공개와 대표작을 따로 바꾼다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ id: "a", slug: "a", is_public: 0, is_featured: 0 }));
    expect(await setWorkFlags(env.DB, "a", { isPublic: true }, LATER)).toBe(true);
    expect(await getWorkBySlug(env.DB, "a")).toMatchObject({ isPublic: true, isFeatured: false });
    expect(await setWorkFlags(env.DB, "a", { isFeatured: true }, LATER)).toBe(true);
    expect(await getWorkBySlug(env.DB, "a")).toMatchObject({ isPublic: true, isFeatured: true });
    expect(await setWorkFlags(env.DB, "none", { isPublic: true }, LATER)).toBe(false);
  });

  it("삭제하면 작품과 파일 기록이 함께 사라진다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ id: "a", slug: "a" }));
    await env.DB.prepare(
      "INSERT INTO files (id, work_id, kind, r2_key, original_name, content_type, created_at) VALUES ('f1', 'a', 'attachment', 'k', 'x.pdf', 'application/pdf', 'now')",
    ).run();
    expect(await countFilesByWork(env.DB)).toEqual(new Map([["a", 1]]));
    expect(await deleteWork(env.DB, "a")).toBe(true);
    expect(await getWorkBySlug(env.DB, "a")).toBeNull();
    expect(await countFilesByWork(env.DB)).toEqual(new Map());
    expect(await deleteWork(env.DB, "a")).toBe(false);
  });
});

describe("listAllWorks / listTagSuggestions", () => {
  it("비공개 작품도 포함해 정렬하고, 분야와 기술 추천을 가나다순으로 모은다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ id: "a", slug: "a", participated_on: "2024-01-01", fields_json: '["디자인","개발"]' }));
    await insertWorkRow(env.DB, makeWorkRow({ id: "b", slug: "b", participated_on: "2025-01-01", is_public: 0, techs_json: '["React","Astro"]' }));
    expect((await listAllWorks(env.DB)).map((work) => work.slug)).toEqual(["b", "a"]);
    expect(await listTagSuggestions(env.DB)).toEqual({ fields: ["개발", "디자인"], techs: ["Astro", "React"] });
  });
});
```

`test/db/profile.test.ts`(전체 교체)
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PROFILE_NAME, getProfile, updateProfile } from "../../src/lib/db/profile";
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

describe("updateProfile", () => {
  it("자기소개를 바꾸고 링크를 JSON으로 저장한다", async () => {
    const profile = await updateProfile(
      env.DB,
      { name: "김작가", headline: null, bio: "소개", email: "me@example.com", githubUrl: null, links: [{ label: "블로그", url: "https://b.com" }] },
      new Date("2026-10-29T00:00:00.000Z"),
    );
    expect(profile).toEqual({
      name: "김작가",
      headline: null,
      bio: "소개",
      email: "me@example.com",
      githubUrl: null,
      links: [{ label: "블로그", url: "https://b.com" }],
      updatedAt: "2026-10-29T00:00:00.000Z",
    });
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/db/adminWorks.test.ts test/db/profile.test.ts`
Expected: FAIL. `adminWorks`를 불러오지 못하고 `updateProfile`이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/db/adminWorks.ts`
```ts
import type { Work } from "../types";
import type { WorkDraft } from "../validate/work";
import { isSlugTaken, slugify, uniqueSlug } from "../works/slug";
import { sortWorks } from "../works/sort";
import { rowToWork, type WorkRow } from "./rows";

export type SaveResult =
  | { ok: true; work: Work }
  | { ok: false; status: 400 | 404; errors: Record<string, string> };

export const SLUG_TAKEN_MESSAGE = "이미 쓰고 있는 주소예요.";

function draftColumns(draft: WorkDraft) {
  return {
    title: draft.title,
    summary: draft.summary,
    description_html: draft.descriptionHtml,
    fields_json: JSON.stringify(draft.fields),
    techs_json: JSON.stringify(draft.techs),
    links_json: JSON.stringify(draft.links),
    competition: draft.competition,
    organizer: draft.organizer,
    participated_on: draft.participatedOn,
    period_start: draft.periodStart,
    period_end: draft.periodEnd,
    award: draft.award,
    team_type: draft.teamType,
    team_size: draft.teamSize,
    role: draft.role,
  };
}

export async function listAllWorks(db: D1Database): Promise<Work[]> {
  const { results } = await db.prepare("SELECT * FROM works").all<WorkRow>();
  return sortWorks(results.map(rowToWork));
}

export async function getWorkById(db: D1Database, id: string): Promise<Work | null> {
  const row = await db.prepare("SELECT * FROM works WHERE id = ?").bind(id).first<WorkRow>();
  return row ? rowToWork(row) : null;
}

export async function getWorkBySlug(db: D1Database, slug: string): Promise<Work | null> {
  const row = await db.prepare("SELECT * FROM works WHERE slug = ?").bind(slug).first<WorkRow>();
  return row ? rowToWork(row) : null;
}

export async function createWork(db: D1Database, draft: WorkDraft, now: Date): Promise<SaveResult> {
  let slug: string;
  if (draft.slug !== null) {
    if (await isSlugTaken(db, draft.slug)) return { ok: false, status: 400, errors: { slug: SLUG_TAKEN_MESSAGE } };
    slug = draft.slug;
  } else {
    slug = await uniqueSlug(db, slugify(draft.title));
  }
  const id = crypto.randomUUID();
  const timestamp = now.toISOString();
  const columns: Record<string, string | number | null> = {
    id,
    slug,
    ...draftColumns(draft),
    is_public: 0,
    is_featured: 0,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const names = Object.keys(columns);
  await db
    .prepare(`INSERT INTO works (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`)
    .bind(...Object.values(columns))
    .run();
  return { ok: true, work: (await getWorkById(db, id))! };
}

export async function updateWork(db: D1Database, id: string, draft: WorkDraft, now: Date): Promise<SaveResult> {
  const existing = await getWorkById(db, id);
  if (!existing) return { ok: false, status: 404, errors: {} };
  const slug = draft.slug ?? existing.slug;
  if (slug !== existing.slug && (await isSlugTaken(db, slug, id))) {
    return { ok: false, status: 400, errors: { slug: SLUG_TAKEN_MESSAGE } };
  }
  const columns: Record<string, string | number | null> = { slug, ...draftColumns(draft), updated_at: now.toISOString() };
  const names = Object.keys(columns);
  await db
    .prepare(`UPDATE works SET ${names.map((name) => `${name} = ?`).join(", ")} WHERE id = ?`)
    .bind(...Object.values(columns), id)
    .run();
  return { ok: true, work: (await getWorkById(db, id))! };
}

export async function setWorkFlags(
  db: D1Database,
  id: string,
  flags: { isPublic?: boolean; isFeatured?: boolean },
  now: Date,
): Promise<boolean> {
  const sets: string[] = [];
  const values: number[] = [];
  if (flags.isPublic !== undefined) {
    sets.push("is_public = ?");
    values.push(flags.isPublic ? 1 : 0);
  }
  if (flags.isFeatured !== undefined) {
    sets.push("is_featured = ?");
    values.push(flags.isFeatured ? 1 : 0);
  }
  if (sets.length === 0) return false;
  const result = await db
    .prepare(`UPDATE works SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`)
    .bind(...values, now.toISOString(), id)
    .run();
  return result.meta.changes > 0;
}

export async function deleteWork(db: D1Database, id: string): Promise<boolean> {
  const [, removed] = await db.batch([
    db.prepare("DELETE FROM files WHERE work_id = ?").bind(id),
    db.prepare("DELETE FROM works WHERE id = ?").bind(id),
  ]);
  return (removed?.meta.changes ?? 0) > 0;
}

export async function countFilesByWork(db: D1Database): Promise<Map<string, number>> {
  const { results } = await db
    .prepare("SELECT work_id, COUNT(*) AS count FROM files WHERE work_id IS NOT NULL GROUP BY work_id")
    .all<{ work_id: string; count: number }>();
  return new Map(results.map((row) => [row.work_id, row.count]));
}

export async function listTagSuggestions(db: D1Database): Promise<{ fields: string[]; techs: string[] }> {
  const works = (await db.prepare("SELECT * FROM works").all<WorkRow>()).results.map(rowToWork);
  const sorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "ko"));
  return { fields: sorted(works.flatMap((work) => work.fields)), techs: sorted(works.flatMap((work) => work.techs)) };
}
```

`src/lib/db/profile.ts`(전체 교체)
```ts
import type { Profile } from "../types";
import type { ProfileDraft } from "../validate/profile";
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

export async function updateProfile(db: D1Database, draft: ProfileDraft, now: Date): Promise<Profile> {
  await db
    .prepare(
      "UPDATE profile SET name = ?, headline = ?, bio = ?, email = ?, github_url = ?, links_json = ?, updated_at = ? WHERE id = 1",
    )
    .bind(draft.name, draft.headline, draft.bio, draft.email, draft.githubUrl, JSON.stringify(draft.links), now.toISOString())
    .run();
  return getProfile(db);
}
```

- [ ] **Step 4: 전체 테스트가 통과하는지 확인한다**

Run: `npm test`
Expected: `Test Files  19 passed (19)`, `Tests  99 passed (99)`

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 7 완료". 커밋하지 않는다.

---

### Task 8: 미들웨어와 관리자 API

**Files:**
- Create: `src/middleware.ts`, `src/lib/http.ts`, `src/pages/robots.txt.ts`
- Create: `src/pages/api/admin/works/index.ts`(POST 만들기), `src/pages/api/admin/works/[id]/index.ts`(PUT 수정)
- Create: `src/pages/api/admin/works/[id]/flags.ts`(POST 폼, 303), `src/pages/api/admin/works/[id]/delete.ts`(POST 폼, 303)
- Create: `src/pages/api/admin/profile.ts`(PUT), `src/pages/api/admin/logout.ts`(POST, 303)

**Interfaces:**
- Consumes: 작업 2~7의 함수 전부
- **미들웨어 동작:**
  - 모든 요청에 대해 `locals.isAdmin`을 채운다.
  - 관리자 경로에서 GET·HEAD·OPTIONS가 아닌 요청이 다른 `Origin`에서 오면 403을 낸다.
  - 로그인하지 않았으면 `/admin/login`을 뺀 관리자 화면은 `/admin/login`으로 302 보내고, API는 401 JSON(`{"error":"로그인이 필요해요."}`)을 낸다.
  - 관리자 경로 응답에는 `X-Robots-Tag: noindex`를 붙인다.
- **API 응답:**
  - 성공: 만들기는 `201 { id, slug }`, 수정은 `200 { id, slug }`, 자기소개는 `200 { name }`.
  - 검사 실패: `400 { errors }`.
  - 없는 작품: `404 { errors: {} }`.
- 이 작업에는 단위 테스트가 없다. 동작은 Claude가 리뷰 때 smoke(작업 10)로 확인한다.

- [ ] **Step 1: 공통 도우미와 미들웨어를 만든다**

`src/lib/http.ts`
```ts
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function jsonError(status: number, errors: Record<string, string>): Response {
  return Response.json({ errors }, { status });
}

export const SERVER_ERROR_MESSAGE = "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
```

`src/middleware.ts`
```ts
import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { isAdminPath, isSameOrigin } from "./lib/auth/request";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth/session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  context.locals.isAdmin = await verifySessionToken(env.SESSION_SECRET, context.cookies.get(SESSION_COOKIE)?.value);

  if (!isAdminPath(pathname)) return next();

  if (!SAFE_METHODS.has(context.request.method) && !isSameOrigin(context.request)) {
    return new Response("Forbidden", { status: 403, headers: { "X-Robots-Tag": "noindex" } });
  }
  if (pathname !== "/admin/login" && !context.locals.isAdmin) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "로그인이 필요해요." }, { status: 401, headers: { "X-Robots-Tag": "noindex" } });
    }
    return context.redirect("/admin/login");
  }
  const response = await next();
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
});
```

`src/pages/robots.txt.ts`
```ts
import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  new Response("User-agent: *\nDisallow: /admin\nDisallow: /api/\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
```

- [ ] **Step 2: API를 만든다**

`src/pages/api/admin/works/index.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createWork } from "../../../../lib/db/adminWorks";
import { sanitizeHtml } from "../../../../lib/html/sanitize";
import { jsonError, readJson } from "../../../../lib/http";
import { validateWorkInput } from "../../../../lib/validate/work";

export const POST: APIRoute = async ({ request }) => {
  const result = validateWorkInput(await readJson(request));
  if (!result.ok) return jsonError(400, result.errors);
  const draft = { ...result.value, descriptionHtml: await sanitizeHtml(result.value.descriptionHtml) };
  const saved = await createWork(env.DB, draft, new Date());
  if (!saved.ok) return jsonError(saved.status, saved.errors);
  return Response.json({ id: saved.work.id, slug: saved.work.slug }, { status: 201 });
};
```

`src/pages/api/admin/works/[id]/index.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { updateWork } from "../../../../../lib/db/adminWorks";
import { sanitizeHtml } from "../../../../../lib/html/sanitize";
import { jsonError, readJson } from "../../../../../lib/http";
import { validateWorkInput } from "../../../../../lib/validate/work";

export const PUT: APIRoute = async ({ params, request }) => {
  const result = validateWorkInput(await readJson(request));
  if (!result.ok) return jsonError(400, result.errors);
  const draft = { ...result.value, descriptionHtml: await sanitizeHtml(result.value.descriptionHtml) };
  const saved = await updateWork(env.DB, params.id ?? "", draft, new Date());
  if (!saved.ok) return jsonError(saved.status, saved.errors);
  return Response.json({ id: saved.work.id, slug: saved.work.slug });
};
```

`src/pages/api/admin/works/[id]/flags.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { setWorkFlags } from "../../../../../lib/db/adminWorks";

// 관리자 목록의 공개·대표작 버튼(일반 HTML 폼)이 보낸다. 값은 "1" 또는 "0".
export const POST: APIRoute = async ({ params, request, redirect }) => {
  const form = await request.formData();
  const toFlag = (name: string) => {
    const value = form.get(name);
    return value === "1" ? true : value === "0" ? false : undefined;
  };
  await setWorkFlags(env.DB, params.id ?? "", { isPublic: toFlag("isPublic"), isFeatured: toFlag("isFeatured") }, new Date());
  return redirect("/admin", 303);
};
```

`src/pages/api/admin/works/[id]/delete.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { deleteWork } from "../../../../../lib/db/adminWorks";

// 3단계에서 R2 객체 삭제를 여기에 더한다.
export const POST: APIRoute = async ({ params, redirect }) => {
  await deleteWork(env.DB, params.id ?? "");
  return redirect("/admin?deleted=1", 303);
};
```

`src/pages/api/admin/profile.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { updateProfile } from "../../../lib/db/profile";
import { jsonError, readJson } from "../../../lib/http";
import { validateProfileInput } from "../../../lib/validate/profile";

export const PUT: APIRoute = async ({ request }) => {
  const result = validateProfileInput(await readJson(request));
  if (!result.ok) return jsonError(400, result.errors);
  const profile = await updateProfile(env.DB, result.value, new Date());
  return Response.json({ name: profile.name });
};
```

`src/pages/api/admin/logout.ts`
```ts
import type { APIRoute } from "astro";
import { SESSION_COOKIE } from "../../../lib/auth/session";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return redirect("/admin/login", 303);
};
```

- [ ] **Step 3: 타입 검사와 빌드를 확인한다**

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: `Complete!`

- [ ] **Step 4: 완료 기록** — HANDOFF에 "작업 8 완료"와 "smoke는 Claude 리뷰에서 실행"을 적는다. 커밋하지 않는다.

---

### Task 9: 관리자 화면

**Files:**
- Create: `src/layouts/AdminLayout.astro`, `src/styles/admin.css`
- Create: `src/pages/admin/login.astro`, `src/pages/admin/index.astro`, `src/pages/admin/works/new.astro`, `src/pages/admin/works/[id]/edit.astro`, `src/pages/admin/profile.astro`
- Create: `src/components/admin/api.ts`, `src/components/admin/errors.ts`, `src/components/admin/useUnsavedWarning.ts`, `src/components/admin/Field.tsx`, `src/components/admin/TagInput.tsx`, `src/components/admin/LinkRowsInput.tsx`, `src/components/admin/RichTextEditor.tsx`, `src/components/admin/WorkForm.tsx`, `src/components/admin/ProfileForm.tsx`

**Interfaces:**
- Consumes: 작업 2~8 전부, 1단계의 `BaseLayout`, `.btn` 등 전역 클래스
- `AdminLayout` props: `{ title: string; current?: "works" | "profile" | null }`
- `WorkForm` props: `{ mode: "create" | "edit"; workId: string | null; initial: WorkInput; suggestions: { fields: string[]; techs: string[] }; savedNotice?: boolean }`
- `ProfileForm` props: `{ initial: ProfileInput }`
- **로그인 페이지:**
  - 같은 페이지로 POST하는 일반 폼이다.
  - 틀리면 401과 `비밀번호가 맞지 않아요.`, 잠기면 429와 `로그인을 너무 많이 시도했어요. 15분 뒤에 다시 시도해 주세요.`를 보여준다.
  - 성공하면 쿠키를 설정하고 `/admin`으로 303 이동한다.
- **작성 폼:**
  - 저장 전에 브라우저에서 `validateWorkInput`으로 먼저 검사한다.
  - 새 작품은 저장하면 `/admin/works/{id}/edit?saved=1`로 이동한다.
  - 저장하지 않은 변경이 있으면 페이지를 떠날 때 경고한다.
  - 칸을 고치면 그 칸의 오류가 사라진다.

- [ ] **Step 1: 레이아웃과 스타일을 만든다**

`src/layouts/AdminLayout.astro`
```astro
---
import "../styles/admin.css";
import BaseLayout from "./BaseLayout.astro";

interface Props {
  title: string;
  current?: "works" | "profile" | null;
}

const { title, current = null } = Astro.props;
---

<BaseLayout title={`${title} | 관리자`} description="포트폴리오 관리자 화면" noindex>
  <header class="admin-bar">
    <div class="admin-container admin-bar-inner">
      <a class="admin-brand" href="/admin">포트폴리오 관리</a>
      <nav class="admin-nav" aria-label="관리자 메뉴">
        <a href="/admin" aria-current={current === "works" ? "page" : undefined}>작품</a>
        <a href="/admin/profile" aria-current={current === "profile" ? "page" : undefined}>자기소개</a>
        <a href="/" target="_blank" rel="noopener">사이트 보기</a>
        <form method="post" action="/api/admin/logout">
          <button class="admin-nav-button" type="submit">로그아웃</button>
        </form>
      </nav>
    </div>
  </header>
  <main class="admin-container admin-main">
    <h1 class="admin-title">{title}</h1>
    <slot />
  </main>
</BaseLayout>
```

`src/styles/admin.css`
```css
/* 관리자 화면 전용 스타일. React 폼도 이 클래스를 쓴다. */
.admin-container {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
}

.admin-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
}

.admin-bar-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  min-height: 60px;
}

.admin-brand {
  color: var(--ink);
  font-weight: 800;
  text-decoration: none;
}

.admin-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.admin-nav a,
.admin-nav-button {
  padding: 6px 10px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.admin-nav a:hover,
.admin-nav-button:hover,
.admin-nav a[aria-current="page"] {
  background: var(--surface);
  color: var(--ink);
}

.admin-main {
  padding-top: 36px;
  padding-bottom: 96px;
}

.admin-title {
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 800;
}

.admin-muted {
  color: var(--muted);
  font-size: 15px;
}

.admin-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.admin-empty {
  padding: 48px 20px;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  color: var(--muted);
  text-align: center;
}

.btn-small {
  height: 34px;
  padding: 0 12px;
  font-size: 14px;
}

.btn-danger {
  border-color: #f3c4c4;
  color: #b42318;
}

.btn-danger:hover {
  border-color: #b42318;
}

.btn-block {
  justify-content: center;
  width: 100%;
}

.btn:disabled {
  cursor: progress;
  opacity: 0.6;
}

.alert {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  font-size: 15px;
}

.alert-success {
  background: #edf8f1;
  color: #157a3c;
}

.alert-error {
  background: #fdecec;
  color: #b42318;
}

.status {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-public {
  background: #edf8f1;
  color: #157a3c;
}

.status-private {
  background: var(--surface);
  color: var(--muted);
}

.status-featured {
  background: #eef1fd;
  color: #2340b0;
}

.work-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.work-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}

.work-row-title {
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
  text-decoration: none;
}

.work-row-title:hover {
  text-decoration: underline;
}

.work-row-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  color: var(--muted);
  font-size: 14px;
}

.work-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.work-row-actions form {
  margin: 0;
}

.form-section {
  margin-bottom: 28px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.form-section h2 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 800;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 0 16px;
}

.field {
  display: block;
  margin-bottom: 18px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.field-required {
  margin-left: 4px;
  color: #b42318;
}

.field input[type="text"],
.field input[type="url"],
.field input[type="email"],
.field input[type="date"],
.field input[type="number"],
.field input[type="password"],
.field select,
.field textarea,
.tag-input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #d3d7de;
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 16px;
}

.field textarea {
  resize: vertical;
  line-height: 1.6;
}

.field [aria-invalid="true"],
.tag-input[aria-invalid="true"],
.editor[aria-invalid="true"] {
  border-color: #b42318;
}

.field-help {
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
}

.field-error {
  margin-top: 6px;
  color: #b42318;
  font-size: 14px;
  font-weight: 600;
}

.choice-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  min-height: 44px;
  align-items: center;
}

.choice-row label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
}

.tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
}

.field .tag-input input[type="text"] {
  flex: 1;
  min-width: 140px;
  min-height: 0;
  padding: 6px 4px;
  border: 0;
  border-radius: 0;
  background: transparent;
  outline: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px 3px 10px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
}

.chip button {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.chip button:hover {
  background: #e4e7ec;
  color: var(--ink);
}

.link-rows {
  display: grid;
  gap: 10px;
}

.link-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) minmax(0, 1.6fr) auto;
  gap: 8px;
  align-items: start;
}

.link-row.no-kind {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) auto;
}

.link-row .field-error {
  grid-column: 1 / -1;
  margin-top: 0;
}

@media (max-width: 640px) {
  .link-row,
  .link-row.no-kind {
    grid-template-columns: 1fr;
  }
}

.editor {
  overflow: hidden;
  border: 1px solid #d3d7de;
  border-radius: var(--radius-sm);
  background: #fff;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.editor-toolbar button {
  padding: 5px 9px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--body);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.editor-toolbar button:hover {
  background: #e4e7ec;
}

.editor-toolbar button[aria-pressed="true"] {
  background: var(--ink);
  color: #fff;
}

.editor-content {
  min-height: 240px;
  padding: 14px 16px;
  outline: none;
  font-size: 16px;
  line-height: 1.75;
}

.editor-content > * + * {
  margin-top: 10px;
}

.editor-content h2 {
  font-size: 21px;
}

.editor-content h3 {
  font-size: 18px;
}

.editor-content p {
  margin: 0;
}

.editor-content ul,
.editor-content ol {
  margin: 0;
  padding-left: 1.4em;
}

.editor-content blockquote {
  margin: 0;
  padding-left: 14px;
  border-left: 3px solid var(--line);
  color: var(--muted);
}

.editor-content pre {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-size: 14px;
}

.editor-content a {
  color: var(--accent);
}

.form-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.96);
}

.login {
  display: grid;
  min-height: 100vh;
  padding: 20px;
  place-items: center;
  background: var(--surface);
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 32px 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}

.login-card h1 {
  margin-bottom: 6px;
  font-size: 24px;
  font-weight: 800;
}

.login-card .admin-muted {
  margin-bottom: 24px;
}
```

- [ ] **Step 2: React 폼 부품을 만든다**

`src/components/admin/api.ts`
```ts
export interface ApiResult {
  ok: boolean;
  status: number;
  data: { id?: string; slug?: string; errors?: Record<string, string> } | null;
}

export async function sendJson(method: "POST" | "PUT", url: string, body: unknown): Promise<ApiResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = (await response.json().catch(() => null)) as ApiResult["data"];
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export function failureMessage(result: ApiResult): string {
  if (result.status === 400) return "입력 내용을 확인해 주세요.";
  if (result.status === 401) return "로그인이 풀렸어요. 새 창에서 다시 로그인한 뒤 저장해 주세요.";
  if (result.status === 404) return "작품을 찾을 수 없어요. 목록에서 다시 열어 주세요.";
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}
```

`src/components/admin/errors.ts`
```ts
// 칸을 고치면 그 칸(과 links.0 같은 하위 칸)의 오류를 지운다.
export function withoutError(errors: Record<string, string>, key: string): Record<string, string> {
  const next = Object.fromEntries(Object.entries(errors).filter(([name]) => name !== key && !name.startsWith(`${key}.`)));
  return Object.keys(next).length === Object.keys(errors).length ? errors : next;
}
```

`src/components/admin/useUnsavedWarning.ts`
```ts
import { useEffect, useRef } from "react";

// 저장하지 않은 변경이 있으면 페이지를 떠날 때 브라우저 경고를 띄운다. 돌려주는 함수를 부르면 경고 없이 떠날 수 있다.
export function useUnsavedWarning(dirty: boolean): () => void {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return () => {
    dirtyRef.current = false;
  };
}
```

`src/components/admin/Field.tsx`
```tsx
import type { ReactNode } from "react";

interface Props {
  id: string;
  label: string;
  required?: boolean;
  help?: ReactNode;
  error?: string;
  children: ReactNode;
}

export default function Field({ id, label, required = false, help, error, children }: Props) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      {children}
      {help && <p className="field-help">{help}</p>}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
```

`src/components/admin/TagInput.tsx`: 한글 조합 중(`isComposing`)에는 Enter를 무시한다.
```tsx
import { useState, type KeyboardEvent } from "react";

interface Props {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder: string;
  invalid?: boolean;
}

export default function TagInput({ id, values, onChange, suggestions, placeholder, invalid = false }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const value = raw.replace(/,/g, "").trim();
    setDraft("");
    if (value !== "" && !values.includes(value)) onChange([...values, value]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="tag-input" aria-invalid={invalid || undefined}>
      {values.map((value) => (
        <span className="chip" key={value}>
          {value}
          <button type="button" aria-label={`${value} 지우기`} onClick={() => onChange(values.filter((v) => v !== value))}>
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        list={`${id}-suggestions`}
        placeholder={values.length === 0 ? placeholder : ""}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
      />
      <datalist id={`${id}-suggestions`}>
        {suggestions
          .filter((suggestion) => !values.includes(suggestion))
          .map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
      </datalist>
    </div>
  );
}
```

`src/components/admin/LinkRowsInput.tsx`
```tsx
import { LINK_KINDS, LINK_KIND_LABELS, type LinkKind } from "../../lib/types";

interface Row {
  kind?: LinkKind;
  label: string;
  url: string;
}

interface Props<T extends Row> {
  id: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  makeEmpty: () => T;
  withKind: boolean;
  errors: Record<string, string>;
  max: number;
}

export default function LinkRowsInput<T extends Row>({ id, rows, onChange, makeEmpty, withKind, errors, max }: Props<T>) {
  const update = (index: number, patch: Partial<Row>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="link-rows">
      {rows.map((row, index) => {
        const error = errors[`links.${index}`];
        return (
          <div className={withKind ? "link-row" : "link-row no-kind"} key={index}>
            {withKind && (
              <select
                aria-label="링크 종류"
                value={row.kind ?? "github"}
                onChange={(event) => update(index, { kind: event.target.value as LinkKind })}
                className="field-select"
              >
                {LINK_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {LINK_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              aria-label="링크 이름"
              placeholder={withKind ? "이름 (비우면 종류 이름)" : "이름 (예: 블로그)"}
              value={row.label}
              onChange={(event) => update(index, { label: event.target.value })}
            />
            <input
              type="url"
              aria-label="링크 주소"
              placeholder="https://"
              value={row.url}
              aria-invalid={error ? true : undefined}
              onChange={(event) => update(index, { url: event.target.value })}
            />
            <button type="button" className="btn btn-small" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
              빼기
            </button>
            {error && <p className="field-error">{error}</p>}
          </div>
        );
      })}
      {rows.length < max && (
        <div>
          <button type="button" className="btn btn-small" id={id} onClick={() => onChange([...rows, makeEmpty()])}>
            링크 추가
          </button>
        </div>
      )}
      {errors.links && <p className="field-error">{errors.links}</p>}
    </div>
  );
}
```

`src/components/admin/RichTextEditor.tsx`
```tsx
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface Props {
  id: string;
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
}

const LINK_PATTERN = /^(https?:\/\/|mailto:)/i;

function promptLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const input = window.prompt("링크 주소를 입력하세요. 비우면 링크를 지워요.", previous ?? "https://");
  if (input === null) return;
  const url = input.trim();
  const chain = editor.chain().focus().extendMarkRange("link");
  if (url === "" || url === "https://") {
    chain.unsetLink().run();
  } else if (!LINK_PATTERN.test(url)) {
    window.alert("주소는 http://, https:// 또는 mailto:로 시작해야 해요.");
  } else {
    chain.setLink({ href: url }).run();
  }
}

export default function RichTextEditor({ id, value, onChange, invalid = false }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["http", "https", "mailto"] },
      }),
    ],
    content: value,
    editorProps: { attributes: { id, class: "editor-content", "aria-label": "작품 설명" } },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? "" : current.getHTML()),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            h2: current.isActive("heading", { level: 2 }),
            h3: current.isActive("heading", { level: 3 }),
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            underline: current.isActive("underline"),
            strike: current.isActive("strike"),
            bulletList: current.isActive("bulletList"),
            orderedList: current.isActive("orderedList"),
            blockquote: current.isActive("blockquote"),
            codeBlock: current.isActive("codeBlock"),
            link: current.isActive("link"),
          }
        : null,
  });

  if (!editor || !active) return null;

  const buttons: { label: string; pressed?: boolean; run: () => void }[] = [
    { label: "소제목", pressed: active.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "작은 제목", pressed: active.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "굵게", pressed: active.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: "기울임", pressed: active.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: "밑줄", pressed: active.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: "취소선", pressed: active.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { label: "목록", pressed: active.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "번호 목록", pressed: active.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "인용", pressed: active.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "코드", pressed: active.codeBlock, run: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: "구분선", run: () => editor.chain().focus().setHorizontalRule().run() },
    { label: "링크", pressed: active.link, run: () => promptLink(editor) },
  ];

  return (
    <div className="editor" aria-invalid={invalid || undefined}>
      <div className="editor-toolbar" role="toolbar" aria-label="서식">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            aria-pressed={button.pressed === undefined ? undefined : button.pressed}
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.run}
          >
            {button.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
```

`src/components/admin/WorkForm.tsx`
```tsx
import { useState } from "react";
import type { WorkLink } from "../../lib/types";
import { charCount } from "../../lib/validate/common";
import { LINKS_MAX, validateWorkInput, type WorkInput } from "../../lib/validate/work";
import { SUMMARY_MAX } from "../../lib/works/summary";
import { failureMessage, sendJson } from "./api";
import { withoutError } from "./errors";
import Field from "./Field";
import LinkRowsInput from "./LinkRowsInput";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";
import { useUnsavedWarning } from "./useUnsavedWarning";

interface Props {
  mode: "create" | "edit";
  workId: string | null;
  initial: WorkInput;
  suggestions: { fields: string[]; techs: string[] };
  savedNotice?: boolean;
}

type Notice = { kind: "success" | "error"; text: string } | null;

export default function WorkForm({ mode, workId, initial, suggestions, savedNotice = false }: Props) {
  const [values, setValues] = useState<WorkInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(savedNotice ? { kind: "success", text: "저장했어요." } : null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const allowLeave = useUnsavedWarning(dirty);

  const set = <K extends keyof WorkInput>(key: K, value: WorkInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => withoutError(withoutError(current, key), key === "teamType" ? "teamSize" : key));
  };

  const showErrors = (next: Record<string, string>) => {
    setErrors(next);
    setNotice({ kind: "error", text: "입력 내용을 확인해 주세요." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    const check = validateWorkInput(values);
    if (!check.ok) {
      showErrors(check.errors);
      return;
    }
    setSaving(true);
    setNotice(null);
    const result =
      mode === "create"
        ? await sendJson("POST", "/api/admin/works", values)
        : await sendJson("PUT", `/api/admin/works/${workId}`, values);
    setSaving(false);
    if (result.ok && result.data?.id) {
      setErrors({});
      setDirty(false);
      if (mode === "create") {
        allowLeave();
        window.location.assign(`/admin/works/${result.data.id}/edit?saved=1`);
        return;
      }
      setValues((current) => ({ ...current, slug: result.data?.slug ?? current.slug }));
      setNotice({ kind: "success", text: "저장했어요." });
      return;
    }
    if (result.status === 400 && result.data?.errors) showErrors(result.data.errors);
    else setNotice({ kind: "error", text: failureMessage(result) });
  }

  const invalid = (key: string) => (errors[key] ? true : undefined);

  return (
    <form onSubmit={submit} noValidate>
      {notice && (
        <p className={`alert ${notice.kind === "success" ? "alert-success" : "alert-error"}`} role={notice.kind === "error" ? "alert" : "status"}>
          {notice.text}
        </p>
      )}
      {mode === "create" && (
        <p className="admin-muted" style={{ marginBottom: 20 }}>
          새 작품은 비공개로 저장돼요. 저장하면 파일을 올릴 수 있어요.
        </p>
      )}

      <section className="form-section">
        <h2>기본 정보</h2>
        <Field id="title" label="작품명" required error={errors.title}>
          <input id="title" type="text" value={values.title} aria-invalid={invalid("title")} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field id="fields" label="작업한 분야" required help="Enter나 쉼표로 하나씩 넣어요. 예: 개발, 디자인, 기획" error={errors.fields}>
          <TagInput id="fields" values={values.fields} onChange={(v) => set("fields", v)} suggestions={suggestions.fields} placeholder="분야 입력" invalid={Boolean(errors.fields)} />
        </Field>
        <Field id="summary" label="한 줄 요약" help={`${charCount(values.summary)}/${SUMMARY_MAX}자 · 비워 두면 설명 앞부분을 써요.`} error={errors.summary}>
          <input id="summary" type="text" value={values.summary} aria-invalid={invalid("summary")} onChange={(e) => set("summary", e.target.value)} />
        </Field>
        <Field id="description" label="작품 설명" required error={errors.descriptionHtml}>
          <RichTextEditor id="description" value={values.descriptionHtml} onChange={(html) => set("descriptionHtml", html)} invalid={Boolean(errors.descriptionHtml)} />
        </Field>
      </section>

      <section className="form-section">
        <h2>대회와 기간</h2>
        <div className="form-grid">
          <Field id="competition" label="참가한 대회" error={errors.competition}>
            <input id="competition" type="text" value={values.competition} aria-invalid={invalid("competition")} onChange={(e) => set("competition", e.target.value)} />
          </Field>
          <Field id="organizer" label="주최 기관" error={errors.organizer}>
            <input id="organizer" type="text" value={values.organizer} aria-invalid={invalid("organizer")} onChange={(e) => set("organizer", e.target.value)} />
          </Field>
          <Field id="participatedOn" label="참가일" error={errors.participatedOn}>
            <input id="participatedOn" type="date" value={values.participatedOn} aria-invalid={invalid("participatedOn")} onChange={(e) => set("participatedOn", e.target.value)} />
          </Field>
          <Field id="award" label="수상" help="예: 대상, 우수상" error={errors.award}>
            <input id="award" type="text" value={values.award} aria-invalid={invalid("award")} onChange={(e) => set("award", e.target.value)} />
          </Field>
          <Field id="periodStart" label="작업 시작일" error={errors.periodStart}>
            <input id="periodStart" type="date" value={values.periodStart} aria-invalid={invalid("periodStart")} onChange={(e) => set("periodStart", e.target.value)} />
          </Field>
          <Field id="periodEnd" label="작업 종료일" error={errors.periodEnd}>
            <input id="periodEnd" type="date" value={values.periodEnd} aria-invalid={invalid("periodEnd")} onChange={(e) => set("periodEnd", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h2>팀과 역할</h2>
        <Field id="teamType" label="팀/개인" error={errors.teamSize}>
          <div className="choice-row" id="teamType">
            {([["", "선택 안 함"], ["solo", "개인"], ["team", "팀"]] as const).map(([value, label]) => (
              <label key={value}>
                <input type="radio" name="teamType" value={value} checked={values.teamType === value} onChange={() => set("teamType", value)} />
                {label}
              </label>
            ))}
            {values.teamType === "team" && (
              <label>
                인원
                <input type="number" min={2} max={999} style={{ width: 90 }} value={values.teamSize} aria-label="팀 인원" aria-invalid={invalid("teamSize")} onChange={(e) => set("teamSize", e.target.value)} />
                명
              </label>
            )}
          </div>
        </Field>
        <Field id="role" label="내 역할" error={errors.role}>
          <input id="role" type="text" value={values.role} aria-invalid={invalid("role")} onChange={(e) => set("role", e.target.value)} />
        </Field>
      </section>

      <section className="form-section">
        <h2>기술과 링크</h2>
        <Field id="techs" label="사용 기술" help="예: React, Figma" error={errors.techs}>
          <TagInput id="techs" values={values.techs} onChange={(v) => set("techs", v)} suggestions={suggestions.techs} placeholder="기술 입력" invalid={Boolean(errors.techs)} />
        </Field>
        <Field id="links" label="링크" help="GitHub, 데모, 영상(유튜브는 상세 페이지에서 바로 재생돼요)">
          <LinkRowsInput<WorkLink>
            id="links"
            rows={values.links}
            onChange={(rows) => set("links", rows)}
            makeEmpty={() => ({ kind: "github", label: "", url: "" })}
            withKind
            errors={errors}
            max={LINKS_MAX}
          />
        </Field>
      </section>

      {mode === "edit" && (
        <section className="form-section">
          <h2>작품 주소</h2>
          <Field id="slug" label="주소" help="바꾸면 예전 링크로는 이 작품이 열리지 않아요." error={errors.slug}>
            <input id="slug" type="text" value={values.slug} aria-invalid={invalid("slug")} onChange={(e) => set("slug", e.target.value)} />
          </Field>
        </section>
      )}

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "저장하는 중…" : "저장"}
        </button>
        <a className="btn" href="/admin">
          목록으로
        </a>
        {dirty && <span className="admin-muted">저장하지 않은 변경이 있어요.</span>}
      </div>
    </form>
  );
}
```

`src/components/admin/ProfileForm.tsx`
```tsx
import { useState } from "react";
import type { ProfileLink } from "../../lib/types";
import { charCount } from "../../lib/validate/common";
import { PROFILE_LINKS_MAX, validateProfileInput, type ProfileInput } from "../../lib/validate/profile";
import { failureMessage, sendJson } from "./api";
import { withoutError } from "./errors";
import Field from "./Field";
import LinkRowsInput from "./LinkRowsInput";
import { useUnsavedWarning } from "./useUnsavedWarning";

interface Props {
  initial: ProfileInput;
}

type Notice = { kind: "success" | "error"; text: string } | null;

export default function ProfileForm({ initial }: Props) {
  const [values, setValues] = useState<ProfileInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useUnsavedWarning(dirty);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => withoutError(current, key));
  };

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    const check = validateProfileInput(values);
    if (!check.ok) {
      setErrors(check.errors);
      setNotice({ kind: "error", text: "입력 내용을 확인해 주세요." });
      return;
    }
    setSaving(true);
    setNotice(null);
    const result = await sendJson("PUT", "/api/admin/profile", values);
    setSaving(false);
    if (result.ok) {
      setErrors({});
      setDirty(false);
      setNotice({ kind: "success", text: "저장했어요." });
    } else if (result.status === 400 && result.data?.errors) {
      setErrors(result.data.errors);
      setNotice({ kind: "error", text: "입력 내용을 확인해 주세요." });
    } else {
      setNotice({ kind: "error", text: failureMessage(result) });
    }
  }

  const invalid = (key: string) => (errors[key] ? true : undefined);

  return (
    <form onSubmit={submit} noValidate>
      {notice && (
        <p className={`alert ${notice.kind === "success" ? "alert-success" : "alert-error"}`} role={notice.kind === "error" ? "alert" : "status"}>
          {notice.text}
        </p>
      )}
      <section className="form-section">
        <h2>홈 첫 화면에 보이는 정보</h2>
        <Field id="name" label="이름" required error={errors.name}>
          <input id="name" type="text" value={values.name} aria-invalid={invalid("name")} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field id="headline" label="한 줄 소개" help="예: 만들고 기록하는 개발자" error={errors.headline}>
          <input id="headline" type="text" value={values.headline} aria-invalid={invalid("headline")} onChange={(e) => set("headline", e.target.value)} />
        </Field>
        <Field id="bio" label="자기소개" help={`${charCount(values.bio)}/1000자 · 줄바꿈이 그대로 보여요.`} error={errors.bio}>
          <textarea id="bio" rows={5} value={values.bio} aria-invalid={invalid("bio")} onChange={(e) => set("bio", e.target.value)} />
        </Field>
      </section>
      <section className="form-section">
        <h2>연락처</h2>
        <div className="form-grid">
          <Field id="email" label="이메일" error={errors.email}>
            <input id="email" type="email" value={values.email} aria-invalid={invalid("email")} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field id="githubUrl" label="GitHub 주소" error={errors.githubUrl}>
            <input id="githubUrl" type="url" placeholder="https://github.com/" value={values.githubUrl} aria-invalid={invalid("githubUrl")} onChange={(e) => set("githubUrl", e.target.value)} />
          </Field>
        </div>
        <Field id="links" label="기타 링크" help="블로그, 링크드인 등">
          <LinkRowsInput<ProfileLink>
            id="links"
            rows={values.links}
            onChange={(rows) => set("links", rows)}
            makeEmpty={() => ({ label: "", url: "" })}
            withKind={false}
            errors={errors}
            max={PROFILE_LINKS_MAX}
          />
        </Field>
      </section>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "저장하는 중…" : "저장"}
        </button>
        {dirty && <span className="admin-muted">저장하지 않은 변경이 있어요.</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 3: 관리자 페이지를 만든다**

`src/pages/admin/login.astro`
```astro
---
import { env } from "cloudflare:workers";
import "../../styles/admin.css";
import BaseLayout from "../../layouts/BaseLayout.astro";
import { clearFailures, getLockStatus, recordFailure } from "../../lib/auth/lockout";
import { verifyPassword } from "../../lib/auth/password";
import { clientIp } from "../../lib/auth/request";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken } from "../../lib/auth/session";

if (Astro.locals.isAdmin) {
  return Astro.redirect("/admin");
}

const LOCKED_MESSAGE = "로그인을 너무 많이 시도했어요. 15분 뒤에 다시 시도해 주세요.";
let error: string | null = null;

if (Astro.request.method === "POST") {
  const now = new Date();
  const ip = clientIp(Astro.request);
  const form = await Astro.request.formData();
  const password = String(form.get("password") ?? "");
  if (!env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    error = "관리자 비밀번호가 아직 설정되지 않았어요.";
    Astro.response.status = 500;
  } else if ((await getLockStatus(env.DB, ip, now)).locked) {
    error = LOCKED_MESSAGE;
    Astro.response.status = 429;
  } else if (await verifyPassword(password, env.ADMIN_PASSWORD_HASH)) {
    await clearFailures(env.DB, ip);
    Astro.cookies.set(SESSION_COOKIE, await createSessionToken(env.SESSION_SECRET, now.getTime()), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return Astro.redirect("/admin", 303);
  } else {
    const status = await recordFailure(env.DB, ip, now);
    error = status.locked ? LOCKED_MESSAGE : "비밀번호가 맞지 않아요.";
    Astro.response.status = status.locked ? 429 : 401;
  }
}
---

<BaseLayout title="관리자 로그인" description="포트폴리오 관리자 로그인" noindex>
  <main class="login">
    <form class="login-card" method="post">
      <h1>관리자 로그인</h1>
      <p class="admin-muted">사이트 주인만 들어올 수 있어요.</p>
      <label class="field">
        <span class="field-label">비밀번호</span>
        <input type="password" name="password" autocomplete="current-password" required autofocus />
      </label>
      {error && <p class="alert alert-error" role="alert">{error}</p>}
      <button class="btn btn-primary btn-block" type="submit">로그인</button>
    </form>
  </main>
</BaseLayout>
```

`src/pages/admin/index.astro`
```astro
---
import { env } from "cloudflare:workers";
import AdminLayout from "../../layouts/AdminLayout.astro";
import { countFilesByWork, listAllWorks } from "../../lib/db/adminWorks";
import { formatDate } from "../../lib/format";
import { sortDateOf } from "../../lib/works/sort";

const [works, fileCounts] = await Promise.all([listAllWorks(env.DB), countFilesByWork(env.DB)]);
const publicCount = works.filter((work) => work.isPublic).length;
const deleted = Astro.url.searchParams.get("deleted") === "1";
---

<AdminLayout title="작품" current="works">
  <div class="admin-toolbar">
    <p class="admin-muted">작품 {works.length}개 · 공개 {publicCount}개</p>
    <a class="btn btn-primary" href="/admin/works/new">새 작품</a>
  </div>
  {deleted && <p class="alert alert-success" role="status">작품을 삭제했어요.</p>}
  {
    works.length === 0 ? (
      <div class="admin-empty">아직 작품이 없어요. 첫 작품을 올려 보세요.</div>
    ) : (
      <ul class="work-list">
        {works.map((work) => (
          <li class="work-row" data-work-id={work.id}>
            <div>
              <a class="work-row-title" href={`/admin/works/${work.id}/edit`}>{work.title}</a>
              <div class="work-row-meta">
                <span class:list={["status", work.isPublic ? "status-public" : "status-private"]}>
                  {work.isPublic ? "공개" : "비공개"}
                </span>
                {work.isFeatured && <span class="status status-featured">대표작</span>}
                <span>{formatDate(sortDateOf(work))}</span>
                <span>{work.fields.join(", ")}</span>
              </div>
            </div>
            <div class="work-row-actions">
              <form method="post" action={`/api/admin/works/${work.id}/flags`}>
                <input type="hidden" name="isPublic" value={work.isPublic ? "0" : "1"} />
                <button class="btn btn-small" type="submit">{work.isPublic ? "비공개로" : "공개하기"}</button>
              </form>
              <form method="post" action={`/api/admin/works/${work.id}/flags`}>
                <input type="hidden" name="isFeatured" value={work.isFeatured ? "0" : "1"} />
                <button class="btn btn-small" type="submit">{work.isFeatured ? "대표작 해제" : "대표작으로"}</button>
              </form>
              <a class="btn btn-small" href={`/works/${encodeURIComponent(work.slug)}`} target="_blank" rel="noopener">
                보기
              </a>
              <a class="btn btn-small" href={`/admin/works/${work.id}/edit`}>수정</a>
              <form
                method="post"
                action={`/api/admin/works/${work.id}/delete`}
                data-confirm={`'${work.title}'을(를) 삭제할까요? 함께 지워지는 파일 ${fileCounts.get(work.id) ?? 0}개. 되돌릴 수 없어요.`}
              >
                <button class="btn btn-small btn-danger" type="submit">삭제</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    )
  }
</AdminLayout>

<script>
  for (const form of document.querySelectorAll<HTMLFormElement>("form[data-confirm]")) {
    form.addEventListener("submit", (event) => {
      if (!window.confirm(form.dataset.confirm ?? "")) event.preventDefault();
    });
  }
</script>
```

`src/pages/admin/works/new.astro`
```astro
---
import { env } from "cloudflare:workers";
import WorkForm from "../../../components/admin/WorkForm";
import AdminLayout from "../../../layouts/AdminLayout.astro";
import { listTagSuggestions } from "../../../lib/db/adminWorks";
import { EMPTY_WORK_INPUT } from "../../../lib/validate/work";

const suggestions = await listTagSuggestions(env.DB);
---

<AdminLayout title="새 작품" current="works">
  <WorkForm client:only="react" mode="create" workId={null} initial={EMPTY_WORK_INPUT} suggestions={suggestions} />
</AdminLayout>
```

`src/pages/admin/works/[id]/edit.astro`
```astro
---
import { env } from "cloudflare:workers";
import WorkForm from "../../../../components/admin/WorkForm";
import AdminLayout from "../../../../layouts/AdminLayout.astro";
import { getWorkById, listTagSuggestions } from "../../../../lib/db/adminWorks";
import { workToInput } from "../../../../lib/validate/work";

const work = await getWorkById(env.DB, Astro.params.id ?? "");
if (!work) {
  return Astro.rewrite("/404");
}
const suggestions = await listTagSuggestions(env.DB);
const saved = Astro.url.searchParams.get("saved") === "1";
const workUrl = `/works/${encodeURIComponent(work.slug)}`;
---

<AdminLayout title="작품 수정" current="works">
  <p class="admin-muted" style="margin-bottom: 20px">
    {work.isPublic ? "공개" : "비공개"}{work.isFeatured ? " · 대표작" : ""}{" · "}<a href={workUrl} target="_blank" rel="noopener"
      >{work.isPublic ? "사이트에서 보기" : "미리보기"}</a
    >
  </p>
  <WorkForm
    client:only="react"
    mode="edit"
    workId={work.id}
    initial={workToInput(work)}
    suggestions={suggestions}
    savedNotice={saved}
  />
</AdminLayout>
```

`src/pages/admin/profile.astro`
```astro
---
import { env } from "cloudflare:workers";
import ProfileForm from "../../components/admin/ProfileForm";
import AdminLayout from "../../layouts/AdminLayout.astro";
import { getProfile } from "../../lib/db/profile";
import { profileToInput } from "../../lib/validate/profile";

const profile = await getProfile(env.DB);
---

<AdminLayout title="자기소개" current="profile">
  <ProfileForm client:only="react" initial={profileToInput(profile)} />
</AdminLayout>
```

- [ ] **Step 4: 타입 검사와 빌드를 확인한다**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`

Run: `npm run build`
Expected: `Complete!`

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 9 완료"와 "화면 확인은 Claude 리뷰에서 실행"을 적는다. 커밋하지 않는다.

---

### Task 10: 상세 페이지의 비공개 미리보기, 예시 데이터, 화면 점검 확장

**Files:**
- Modify: `src/pages/works/[slug].astro`(전체 교체), `seed/dev.sql`(전체 교체), `scripts/smoke.mjs`(전체 교체)

**Interfaces:**
- 상세 페이지 변경:
  - 공개 작품이 없고 관리자로 로그인했으면 비공개 작품도 연다. 이때 `비공개 미리보기 · 방문자에게는 보이지 않아요.` 띠를 붙이고 `noindex`로 만든다.
  - 설명은 `sanitizeHtml`을 거쳐 화면에 낸다.
- 예시 데이터 변경: smoke가 만든 `스모크%` 작품을 지우는 줄을 더한다.
- smoke 확장: 방문자 점검 20개 뒤에 관리자 점검 25개를 더해 모두 45개가 된다. `SMOKE_ADMIN_PASSWORD` 환경 변수가 없으면 `portfolio-dev-password`를 쓴다.

- [ ] **Step 1: 파일을 바꾼다**

`src/pages/works/[slug].astro`(전체 교체)
```astro
---
import { env } from "cloudflare:workers";
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getProfile } from "../../lib/db/profile";
import { getWorkBySlug } from "../../lib/db/adminWorks";
import { getPublicWorkBySlug } from "../../lib/db/works";
import { formatDate, formatPeriod, teamLabel } from "../../lib/format";
import { sanitizeHtml } from "../../lib/html/sanitize";
import { LINK_KIND_LABELS } from "../../lib/types";
import { isAwarded } from "../../lib/works/filter";
import { summaryOf } from "../../lib/works/summary";
import { youtubeEmbedUrl } from "../../lib/works/youtube";

const slug = Astro.params.slug ?? "";
let work = await getPublicWorkBySlug(env.DB, slug);
let preview = false;
if (!work && Astro.locals.isAdmin) {
  work = await getWorkBySlug(env.DB, slug);
  preview = work !== null;
}
if (!work) {
  return Astro.rewrite("/404");
}

const profile = await getProfile(env.DB);
const descriptionHtml = await sanitizeHtml(work.descriptionHtml);
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

<BaseLayout title={`${work.title} | ${profile.name}`} description={summaryOf(work)} ownerName={profile.name} noindex={preview}>
  <main class="container detail">
    {
      preview && (
        <p class="preview-banner" role="note">
          비공개 미리보기 · 방문자에게는 보이지 않아요. <a href={`/admin/works/${work.id}/edit`}>수정하기</a>
        </p>
      )
    }
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
      <div class="prose" set:html={descriptionHtml} />
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
  .preview-banner {
    margin-bottom: 24px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    background: #fff4e5;
    color: #a4520a;
    font-size: 15px;
    font-weight: 600;
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

`seed/dev.sql`(전체 교체)
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
DELETE FROM works WHERE title LIKE '스모크%';

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

`scripts/smoke.mjs`(전체 교체)
```js
// 로컬 개발 서버를 직접 띄워 방문자 화면을 점검하고 끈다.
// 먼저 `npm run db:migrate:local` 과 `npm run db:seed:local` 을 실행하고, .dev.vars를 준비해야 한다.
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";

const port = Number(process.env.SMOKE_PORT ?? 4398);
const base = `http://localhost:${port}`;
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "portfolio-dev-password";
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

async function request(pathname, { method = "GET", cookie, origin = true, form, json } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (origin && method !== "GET") headers.Origin = base;
  let body;
  if (form) {
    body = new URLSearchParams(form).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  if (json !== undefined) {
    body = JSON.stringify(json);
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(base + pathname, { method, headers, body, redirect: "manual" });
  const html = await res.text();
  let data = null;
  try {
    data = JSON.parse(html);
  } catch {
    // HTML 응답
  }
  return { status: res.status, html, data, headers: res.headers };
}

const sessionCookie = (headers) => headers.getSetCookie().find((value) => value.startsWith("session=")) ?? "";

function workBody(title, extra = {}) {
  return {
    title,
    slug: "",
    summary: "",
    descriptionHtml: '<p>안녕<script>alert(1)</script><a href="javascript:alert(1)">링크</a></p>',
    fields: ["개발"],
    techs: [],
    links: [],
    competition: "",
    organizer: "",
    participatedOn: "",
    periodStart: "",
    periodEnd: "",
    award: "",
    teamType: "",
    teamSize: "",
    role: "",
    ...extra,
  };
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

  // ---- 2단계: 로그인과 작품 관리 ----
  const guarded = await request("/admin");
  check(
    "관리자 화면은 로그인으로 보낸다",
    guarded.status === 302 && guarded.headers.get("location") === "/admin/login",
    `${guarded.status} ${guarded.headers.get("location")}`,
  );
  const loginPage = await request("/admin/login");
  check("로그인 화면 noindex", loginPage.status === 200 && loginPage.headers.get("x-robots-tag") === "noindex");
  const wrong = await request("/admin/login", { method: "POST", form: { password: "wrong-password" } });
  check("틀린 비밀번호 401", wrong.status === 401 && wrong.html.includes("비밀번호가 맞지 않아요."), String(wrong.status));
  const foreign = await request("/admin/login", { method: "POST", origin: false, form: { password: ADMIN_PASSWORD } });
  check("Origin 없는 로그인 403", foreign.status === 403, String(foreign.status));
  const login = await request("/admin/login", { method: "POST", form: { password: ADMIN_PASSWORD } });
  const setCookie = sessionCookie(login.headers);
  check(
    "맞는 비밀번호로 로그인",
    login.status === 303 &&
      login.headers.get("location") === "/admin" &&
      /HttpOnly/i.test(setCookie) &&
      /SameSite=Strict/i.test(setCookie),
    `${login.status} ${setCookie}`,
  );
  const cookie = setCookie.split(";")[0];

  const list = await request("/admin", { cookie });
  check(
    "목록에 비공개 작품도 보인다",
    list.status === 200 && list.html.includes("비공개 초안 작품") && list.headers.get("x-robots-tag") === "noindex",
  );
  check("API: 로그인 없으면 401", (await request("/api/admin/works", { method: "POST", json: workBody("x") })).status === 401);
  check(
    "API: Origin 없으면 403",
    (await request("/api/admin/works", { method: "POST", cookie, origin: false, json: workBody("x") })).status === 403,
  );
  const invalid = await request("/api/admin/works", { method: "POST", cookie, json: workBody("") });
  check(
    "API: 작품명 없으면 400",
    invalid.status === 400 && invalid.data?.errors?.title === "작품명을 입력해 주세요.",
    JSON.stringify(invalid.data),
  );

  const created = await request("/api/admin/works", { method: "POST", cookie, json: workBody("스모크 테스트 작품") });
  check(
    "작품 만들기 201과 한글 주소",
    created.status === 201 && created.data?.slug === "스모크-테스트-작품",
    JSON.stringify(created.data),
  );
  const firstId = created.data?.id;
  const smokePath = workPath("스모크-테스트-작품");
  check("새 작품은 방문자에게 404", (await request(smokePath)).status === 404);
  const preview = await request(smokePath, { cookie });
  check("관리자는 비공개 미리보기", preview.status === 200 && preview.html.includes("비공개 미리보기"));
  check("설명의 script와 javascript: 링크 제거", preview.html.includes("안녕") && !preview.html.includes("alert(1)"));
  const publish = await request(`/api/admin/works/${firstId}/flags`, { method: "POST", cookie, form: { isPublic: "1" } });
  check("공개 전환 후 목록으로", publish.status === 303 && publish.headers.get("location") === "/admin");
  const published = await request(smokePath);
  check("공개하면 방문자에게 보인다", published.status === 200 && !published.html.includes("비공개 미리보기"));

  const second = await request("/api/admin/works", { method: "POST", cookie, json: workBody("스모크 테스트 작품") });
  check(
    "같은 이름이면 주소에 -2",
    second.status === 201 && second.data?.slug === "스모크-테스트-작품-2",
    JSON.stringify(second.data),
  );
  const clash = await request(`/api/admin/works/${firstId}`, {
    method: "PUT",
    cookie,
    json: workBody("스모크 테스트 작품", { slug: "스모크-테스트-작품-2" }),
  });
  check(
    "다른 작품 주소로 바꾸면 400",
    clash.status === 400 && clash.data?.errors?.slug === "이미 쓰고 있는 주소예요.",
    JSON.stringify(clash.data),
  );
  const renamed = await request(`/api/admin/works/${firstId}`, {
    method: "PUT",
    cookie,
    json: workBody("스모크 수정 작품", { slug: "스모크-수정" }),
  });
  check("작품 수정 200", renamed.status === 200 && renamed.data?.slug === "스모크-수정", JSON.stringify(renamed.data));
  check("수정한 주소로 열린다", (await request(workPath("스모크-수정"))).status === 200);
  const pages = await Promise.all(
    ["/admin/works/new", "/admin/profile", `/admin/works/${firstId}/edit`].map((pathname) => request(pathname, { cookie })),
  );
  check(
    "관리자 페이지 열림(새 작품, 자기소개, 수정)",
    pages.every((page) => page.status === 200),
    pages.map((page) => page.status).join(","),
  );
  for (const workId of [firstId, second.data?.id]) {
    await request(`/api/admin/works/${workId}/delete`, { method: "POST", cookie });
  }
  check("삭제하면 404", (await request(workPath("스모크-수정"))).status === 404);

  const badProfile = await request("/api/admin/profile", {
    method: "PUT",
    cookie,
    json: { name: "", headline: "", bio: "", email: "", githubUrl: "", links: [] },
  });
  check("자기소개 이름 없으면 400", badProfile.status === 400 && badProfile.data?.errors?.name === "이름을 입력해 주세요.");
  const goodProfile = await request("/api/admin/profile", {
    method: "PUT",
    cookie,
    json: {
      name: "홍길동",
      headline: "만들고 기록하는 개발자이자 디자이너",
      bio: "대회와 프로젝트에서 만든 작업을 모았습니다. 새로운 문제를 함께 풀 팀을 찾고 있어요.",
      email: "hello@example.com",
      githubUrl: "https://github.com/example",
      links: [{ label: "블로그", url: "https://example.com" }],
    },
  });
  check("자기소개 저장 200", goodProfile.status === 200 && goodProfile.data?.name === "홍길동");

  const robots = await request("/robots.txt");
  check("robots.txt가 /admin을 막는다", robots.status === 200 && robots.html.includes("Disallow: /admin"));
  const logout = await request("/api/admin/logout", { method: "POST", cookie });
  const cleared = sessionCookie(logout.headers);
  check(
    "로그아웃하면 쿠키를 지운다",
    logout.status === 303 &&
      logout.headers.get("location") === "/admin/login" &&
      /(Max-Age=0|Expires=Thu, 01 Jan 1970)/i.test(cleared),
    cleared,
  );
} finally {
  stopServer();
}

console.log(`smoke: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: 타입 검사와 빌드, 문법을 확인한다**

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: `Complete!`

Run: `node --check scripts/smoke.mjs`
Expected: 출력 없이 종료 코드 0

- [ ] **Step 3: 완료 기록** — HANDOFF에 "작업 10 완료, smoke 45개는 Claude 리뷰에서 실행"을 적는다. 커밋하지 않는다.

---

### Task 11: 최종 검증과 인계

**Files:**
- Create: `collab/HANDOFF.md`(처음부터 다시 쓴다)

- [ ] **Step 1: 전체 검증을 실행한다**

Run: `npm test`
Expected: `Test Files  19 passed (19)`, `Tests  99 passed (99)`

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`

Run: `npm run build`
Expected: `Complete!`

- [ ] **Step 2: `collab/HANDOFF.md`를 쓴다**

협업 규칙 6번 형식으로 쓴다.
- 실행한 계획 파일
- 작업별 완료 여부와 바꾼 파일. 작업별 파일 목록은 Claude가 작업별 커밋을 만들 때 쓴다.
- 계획과 다르게 한 부분과 이유(없으면 "없음")
- `git status --short --untracked-files=all` 결과
- 위 검증 명령의 종료 코드와 결과 줄
- 미실행 항목: smoke, 화면 확인, 커밋은 "Claude 리뷰에서 실행"으로 적는다.
- 막힌 지점, 질문, 남은 위험

비밀값(`.dev.vars` 내용)은 적지 않는다.

---

## Claude 리뷰 순서(샌드박스 밖)

1. `HANDOFF.md`와 실제 변경 내용을 확인한다. 계획의 코드 블록과 파일을 줄바꿈만 맞춰 대조한다.
2. `npm test`, `npm run check`, `npm run build`를 다시 실행한다.
3. `npm run db:migrate:local`, `npm run db:seed:local`, `npm run smoke`를 실행한다. 기대 결과는 `smoke: 45 passed, 0 failed`.
4. 배포용 빌드 미리보기를 띄우고 Chrome으로 관리자 화면을 조작해 확인한다. 1280px와 375px 폭에서 본다.
5. 문제가 없으면 작업별로 커밋한다(아래 메시지). 문제가 있으면 계획 끝에 "수정 작업"을 더해 Codex를 한 번 더 실행한다.

| 작업 | 커밋 메시지 |
|---|---|
| 1 | `chore: add React, Tiptap and admin secrets setup` |
| 2 | `feat: add password hashing and signed session cookies` |
| 3 | `feat: add origin check and login lockout` |
| 4 | `feat: sanitize work descriptions with HTMLRewriter` |
| 5 | `feat: add slug generation and uniqueness` |
| 6 | `feat: add shared work and profile validation` |
| 7 | `feat: add admin queries for works and profile` |
| 8 | `feat: add admin middleware and JSON API` |
| 9 | `feat: add admin pages and React forms` |
| 10 | `feat: add private preview and admin smoke checks` |
| 11 | `docs: add stage 2 handoff` |
