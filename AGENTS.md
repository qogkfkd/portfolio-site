# AGENTS.md

개인 포트폴리오 사이트. Astro 7을 Cloudflare Workers에 올리고, 데이터는 D1(`DB`), 이미지와 첨부파일은 R2(`FILES`)에 둔다.

- 설계: `docs/superpowers/specs/2026-10-27-portfolio-site-design.md`
- 구현 계획: `docs/superpowers/plans/`
- 협업 규칙: `C:/Users/user/.codex-collab/RULES.md`. 승인된 계획만 실행하고, 인계는 `collab/HANDOFF.md`에 쓴다.

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
- 파일 기능은 `src/lib/files/`에 있다. 업로드는 R2 멀티파트(10MiB 조각), 파일 제공은 `/files/{id}/{이름}`(썸네일은 `?v=thumb`)이다. 용량 상수는 `src/lib/files/rules.ts`에 있다.
- R2도 같은 파일 안의 테스트끼리 격리되지 않는다. 파일 테스트는 `beforeEach`에서 `resetBucket(env.FILES)`도 부른다.
- Codex 샌드박스에서는 `.git` 쓰기와 개발 서버 실행이 막혀 있다. 커밋, `npm run dev`, `npm run smoke`는 Claude가 리뷰 때 샌드박스 밖에서 한다.
- 배포(`wrangler deploy`), 로그인(`wrangler login`), `--remote` 명령, `git push`는 하지 않는다.
