# 2단계 로그인과 작품 관리 구현·검증 인계

## 실행 계획과 완료 상태

- 실행 계획: `docs/superpowers/plans/2026-10-29-stage2-admin.md`. Claude가 작성하고 사용자가 승인한 계획의 작업 1~11을 순서대로 실행했다.
- 시작 기준: `main`, `cd93d13` (`docs: 2단계(로그인과 작품 관리) 구현 계획 추가`). 이전 1단계 인계 커밋은 `d6d2d38`이다.
- **Codex 실행분 완료:** 작업 1~10 구현·지정 검증, 작업 11 최종 전체 검증 및 이 인계 문서 작성.
- **Claude 리뷰에서 실행:** 계획 대비 리뷰, 로컬 DB 준비, smoke 45개, 실제 브라우저 화면·동작 확인, 작업별 커밋.
- 작업 시작 시 공통 규칙, 프로젝트 AGENTS.md, 승인 계획, 스펙을 UTF-8로 읽었다. 루트 CLAUDE.md와 src/test/scripts/docs/collab 아래 추가 AGENTS.md·CLAUDE.md는 없었다.
- 실행 환경: Node `v24.19.0`, npm `11.17.0`. 시작 전 추적 파일 변경은 없었다.

## 작업별 완료와 파일 목록

각 작업의 코드는 계획에서 직접 추출해 UTF-8로 썼다. 아래 목록은 Claude의 작업별 커밋 구분에 사용한다.

### 작업 1 완료 — 의존성과 설정

- 변경: `package.json`, `package-lock.json`(npm 생성), `astro.config.mjs`, `tsconfig.json`, `AGENTS.md`.
- 생성: `src/env.d.ts`, `.dev.vars.example`.
- 로컬 생성: `.dev.vars`(예시 복사, Git 제외). 내용을 인계에 기록하지 않는다.
- 의존성 설치와 기존 테스트·타입 검사·빌드 통과.

### 작업 2 완료 — 비밀번호 해시와 세션 쿠키

- 생성: `src/lib/auth/password.ts`, `src/lib/auth/session.ts`, `scripts/hash-password.mjs`.
- 생성: `test/auth/password.test.ts`, `test/auth/session.test.ts`.
- 구현 전 모듈 누락 실패 확인 후 8개 테스트 통과. 해시 CLI의 짧은 비밀번호 거절 및 정상 형식 출력을 확인했다.

### 작업 3 완료 — 요청 검사와 로그인 잠금

- 생성: `src/lib/auth/request.ts`, `src/lib/auth/lockout.ts`.
- 생성: `test/auth/request.test.ts`, `test/auth/lockout.test.ts`.
- 구현 전 모듈 누락 실패 확인 후 7개 테스트 통과.

### 작업 4 완료 — 설명 서식 정리

- 생성: `src/lib/html/sanitize.ts`, `test/html/sanitize.test.ts`.
- 구현 전 모듈 누락 실패 확인 후 Workers HTMLRewriter로 6개 테스트 통과.

### 작업 5 완료 — 작품 주소

- 생성: `src/lib/works/slug.ts`, `test/works/slug.test.ts`.
- 구현 전 모듈 누락 실패 확인 후 7개 테스트 통과.

### 작업 6 완료 — 입력 검사

- 생성: `src/lib/validate/common.ts`, `src/lib/validate/work.ts`, `src/lib/validate/profile.ts`.
- 생성: `test/validate/work.test.ts`, `test/validate/profile.test.ts`.
- 구현 전 모듈 누락 실패 확인 후 11개 테스트 통과.

### 작업 7 완료 — 관리자 DB 함수

- 생성: `src/lib/db/adminWorks.ts`, `test/db/adminWorks.test.ts`.
- 전체 교체: `src/lib/db/profile.ts`, `test/db/profile.test.ts`.
- 구현 전 adminWorks 모듈 누락과 updateProfile 함수 없음 실패 확인 후 전체 19개 파일·99개 테스트 통과.

### 작업 8 완료 — 미들웨어와 API

- 생성: `src/middleware.ts`, `src/lib/http.ts`, `src/pages/robots.txt.ts`.
- 생성: `src/pages/api/admin/works/index.ts`, `src/pages/api/admin/works/[id]/index.ts`, `src/pages/api/admin/works/[id]/flags.ts`, `src/pages/api/admin/works/[id]/delete.ts`.
- 생성: `src/pages/api/admin/profile.ts`, `src/pages/api/admin/logout.ts`.
- 타입 검사·빌드 통과. 이 작업에는 단위 테스트가 없다는 계획을 따랐다. **smoke는 Claude 리뷰에서 실행.**

### 작업 9 완료 — 관리자 화면

- 생성: `src/layouts/AdminLayout.astro`, `src/styles/admin.css`.
- 생성: `src/components/admin/api.ts`, `src/components/admin/errors.ts`, `src/components/admin/useUnsavedWarning.ts`.
- 생성: `src/components/admin/Field.tsx`, `src/components/admin/TagInput.tsx`, `src/components/admin/LinkRowsInput.tsx`, `src/components/admin/RichTextEditor.tsx`, `src/components/admin/WorkForm.tsx`, `src/components/admin/ProfileForm.tsx`.
- 생성: `src/pages/admin/login.astro`, `src/pages/admin/index.astro`, `src/pages/admin/works/new.astro`, `src/pages/admin/works/[id]/edit.astro`, `src/pages/admin/profile.astro`.
- 타입 검사·빌드 통과. **화면 확인은 Claude 리뷰에서 실행.**

### 작업 10 완료 — 비공개 미리보기와 smoke 확장

- 전체 교체: `src/pages/works/[slug].astro`, `seed/dev.sql`, `scripts/smoke.mjs`.
- 타입 검사·빌드·smoke 스크립트 문법 검사 통과. **smoke 45개는 Claude 리뷰에서 실행.**

### 작업 11 완료 — 최종 검증과 인계

- 최종 `npm test` → `npm run check` → `npm run build`를 순서대로 실행해 모두 통과했다.
- `collab/HANDOFF.md`를 처음부터 다시 작성했다.
- 실제 구현 56개 파일이 계획의 코드 블록 56개와 정확히 일치함을 확인했다. 줄바꿈까지 동일하다.
- 커밋은 하지 않았다.

## 검증 명령과 결과

### 작업별 검증

| 작업 | 명령 | 종료 코드 | 실제 결과 |
|---|---|---:|---|
| 1 | `npm install` | 0 | 59 packages 추가, 취약점 0. allow-scripts 경고 유지 |
| 1 | `Copy-Item .dev.vars.example .dev.vars` | 0 | 로컬 파일 생성. Git 제외 확인 |
| 1 | `npm test` | 0 | 10개 파일·51개 통과 |
| 1 | `npm run check` | 0 | 36개 파일, 0 errors / 0 warnings / 0 hints |
| 1 | `npm run build` | 0 | Complete! |
| 2 RED | `npm test -- test/auth/password.test.ts test/auth/session.test.ts` | 1 | 두 구현 모듈 누락. 계획 예상과 일치 |
| 2 GREEN | 같은 테스트 명령 | 0 | 2개 파일·8개 통과 |
| 2 | `npm run hash-password -- short` | 1 | 계획의 8자 이상 한국어 안내 출력. 예상한 거절 |
| 2 | `npm run hash-password -- portfolio-dev-password` | 0 | pbkdf2:100000:로 시작하는 형식 출력. 값 생략 |
| 3 RED | `npm test -- test/auth/request.test.ts test/auth/lockout.test.ts` | 1 | 두 구현 모듈 누락. 계획 예상과 일치 |
| 3 GREEN | 같은 테스트 명령 | 0 | 2개 파일·7개 통과 |
| 4 RED | `npm test -- test/html/sanitize.test.ts` | 1 | sanitize 모듈 누락. 계획 예상과 일치 |
| 4 GREEN | 같은 테스트 명령 | 0 | 1개 파일·6개 통과 |
| 5 RED | `npm test -- test/works/slug.test.ts` | 1 | slug 모듈 누락. 계획 예상과 일치 |
| 5 GREEN | 같은 테스트 명령 | 0 | 1개 파일·7개 통과 |
| 6 RED | `npm test -- test/validate/work.test.ts test/validate/profile.test.ts` | 1 | 두 구현 모듈 누락. 계획 예상과 일치 |
| 6 GREEN | 같은 테스트 명령 | 0 | 2개 파일·11개 통과 |
| 7 RED | `npm test -- test/db/adminWorks.test.ts test/db/profile.test.ts` | 1 | adminWorks 모듈 누락 및 updateProfile is not a function. 기존 profile 2개 통과 |
| 7 GREEN | `npm test` | 0 | 19개 파일·99개 통과 |
| 8 | `npm run check` | 0 | 64개 파일, 0 errors / 0 warnings / 0 hints |
| 8 | `npm run build` | 0 | Complete! |
| 9 | `npm run check` | 0 | 79개 파일, 0 errors / 0 warnings / 0 hints |
| 9 | `npm run build` | 0 | Complete! |
| 10 | `npm run check` | 0 | 79개 파일, 0 errors / 0 warnings / 0 hints |
| 10 | `npm run build` | 0 | Complete! |
| 10 | `node --check scripts/smoke.mjs` | 0 | 출력 없음 |

### 작업 11 최종 검증

| 명령 | 종료 코드 | 실제 결과 |
|---|---:|---|
| `npm test` | 0 | Test Files 19 passed (19), Tests 99 passed (99) |
| `npm run check` | 0 | Result (79 files): 0 errors, 0 warnings, 0 hints |
| `npm run build` | 0 | [build] Complete! |
| 계획 코드 블록과 실제 파일의 UTF-8 내용 대조 | 0 | 56개 모두 정확히 일치 |
| .dev.vars와 예시의 바이트 대조 | 0 | 일치. 내용은 출력하지 않음 |
| `git diff --check` | 0 | 공백 오류 없음. Git의 LF→CRLF 안내 경고만 발생 |
| `git diff --name-only -- docs` | 0 | 출력 없음. 계획·스펙 변경 없음 |
| `git check-ignore .dev.vars` | 0 | .dev.vars가 Git 제외됨 |

- npm 명령 프로세스에서만 `npm_config_cache`와 `WRANGLER_LOG_PATH`를 시스템 임시 폴더의 `portfolio-stage2-npm-cache`, `portfolio-stage2-wrangler`로 지정했다. 기존 인계에 기록된 기본 경로 쓰기 제한과 이번 계획의 허용을 따른 것이다. 저장소 설정을 바꾸지 않았다.
- check/build가 생성하는 ignored 파일(worker-configuration.d.ts, .astro, dist 등)은 명령 실행 산출물이며 수동으로 편집하지 않았다.
- 첫 작업 5 파일 복사에서 제가 test/works 폴더 생성을 빠뜨려 경로 없음 오류(코드 1)가 발생했다. 폴더를 만든 뒤 같은 계획 코드로 복사해 해결했다. 테스트 실행 전의 도구 실행 실수였으며 같은 오류가 반복되지 않았다.
- 계획상 의도한 RED 및 짧은 비밀번호 거절 외에 남아 있는 검증 실패는 없다.

## 변경 범위와 Git 상태

- 시작 전부터 있던 `.codex-collab.lock`, `docs/1단계-진행-보고.pdf`, `docs/포트폴리오-사이트-설계서.pdf`는 수정·삭제하지 않았다.
- 계획이 허용한 파일만 작성했다. package-lock.json은 npm이 갱신했다. `.dev.vars`는 Git에서 제외된다.
- `git status --short --untracked-files=all` 결과(한국어 경로 가독성을 위해 core.quotepath=false):

```text
 M AGENTS.md
 M astro.config.mjs
 M collab/HANDOFF.md
 M package-lock.json
 M package.json
 M scripts/smoke.mjs
 M seed/dev.sql
 M src/lib/db/profile.ts
 M src/pages/works/[slug].astro
 M test/db/profile.test.ts
 M tsconfig.json
?? .codex-collab.lock
?? .dev.vars.example
?? docs/1단계-진행-보고.pdf
?? docs/포트폴리오-사이트-설계서.pdf
?? scripts/hash-password.mjs
?? src/components/admin/Field.tsx
?? src/components/admin/LinkRowsInput.tsx
?? src/components/admin/ProfileForm.tsx
?? src/components/admin/RichTextEditor.tsx
?? src/components/admin/TagInput.tsx
?? src/components/admin/WorkForm.tsx
?? src/components/admin/api.ts
?? src/components/admin/errors.ts
?? src/components/admin/useUnsavedWarning.ts
?? src/env.d.ts
?? src/layouts/AdminLayout.astro
?? src/lib/auth/lockout.ts
?? src/lib/auth/password.ts
?? src/lib/auth/request.ts
?? src/lib/auth/session.ts
?? src/lib/db/adminWorks.ts
?? src/lib/html/sanitize.ts
?? src/lib/http.ts
?? src/lib/validate/common.ts
?? src/lib/validate/profile.ts
?? src/lib/validate/work.ts
?? src/lib/works/slug.ts
?? src/middleware.ts
?? src/pages/admin/index.astro
?? src/pages/admin/login.astro
?? src/pages/admin/profile.astro
?? src/pages/admin/works/[id]/edit.astro
?? src/pages/admin/works/new.astro
?? src/pages/api/admin/logout.ts
?? src/pages/api/admin/profile.ts
?? src/pages/api/admin/works/[id]/delete.ts
?? src/pages/api/admin/works/[id]/flags.ts
?? src/pages/api/admin/works/[id]/index.ts
?? src/pages/api/admin/works/index.ts
?? src/pages/robots.txt.ts
?? src/styles/admin.css
?? test/auth/lockout.test.ts
?? test/auth/password.test.ts
?? test/auth/request.test.ts
?? test/auth/session.test.ts
?? test/db/adminWorks.test.ts
?? test/html/sanitize.test.ts
?? test/validate/profile.test.ts
?? test/validate/work.test.ts
?? test/works/slug.test.ts
```

## 계획과 다르게 한 부분과 지침 우선순위

- 기능·설계·문구·코드·패키지 버전의 계획 대비 변경: **없음**.
- 공통 규칙의 일반 설치 금지보다 이번 승인 계획의 작업 1 npm install 지시를 우선했다. 전역 설치와 npm approve-scripts는 하지 않았다.
- executing-plans의 자율 설계 판단·계획 수정·리뷰 에이전트 호출은 사용자 지시 및 공통 협업 규칙과 충돌하므로 적용하지 않았다. 계획 대비 리뷰는 Claude 담당이다.
- 허용 파일 제한과 .git 쓰기 금지에 따라 별도 worktree나 .superpowers 진행 파일을 만들지 않고 HANDOFF에 작업별 진행을 기록했다. 커밋 및 브랜치 통합 절차도 실행하지 않았다.
- 계획에 지정된 테스트부터 실패를 확인하고 구현·통과 순서로 실행했다. 작업 8~10의 단위 테스트 추가나 서버 검증은 계획에 없으므로 만들거나 실행하지 않았다.
- 잠금 파일은 실행기가 독점 보유해 읽을 수 없었다. run-codex.ps1 소스가 현재 요청과 같은 구현 요청문으로 Codex를 호출하면서 잠금을 잡는 구조임을 읽어 확인했다. 실행기를 호출하거나 잠금을 수정하지 않았다.
- rg가 없어 PowerShell Get-ChildItem·Select-String·정규식을 사용했다.
- 기획 스킬, 다른 Claude/Codex 재귀 호출, 계획 밖 기능·리팩터링·디자인 변경을 하지 않았다. 배포·로그인·원격 명령·push·샌드박스 해제도 하지 않았다.

## 미실행 항목과 남은 위험

- 막힌 지점·계획 해석 질문: **없음**. Codex 실행분은 완료했다.
- `npm run db:migrate:local`, `npm run db:seed:local`, `npm run smoke`: **Claude 리뷰에서 실행**. 이번 실행에서는 로컬 DB 준비·서버 실행을 하지 않았다. 목표는 `smoke: 45 passed, 0 failed`이며 아직 확인한 결과가 아니다.
- 배포용 빌드 미리보기 및 Chrome의 1280px·375px 화면·동작 확인: **Claude 리뷰에서 실행**. 로그인, 빈 폼 오류, 한글 태그 입력, 설명 편집기, 저장 후 수정, 목록, 자기소개, 비공개 미리보기를 확인해야 한다.
- 타입 검사·빌드·단위/DB 테스트 통과가 실제 HTTP 응답, React 하이드레이션, 쿠키 전달, 편집기 조작, 저장하지 않은 변경 경고를 보증하지 않는다. 계획의 smoke 및 실제 브라우저 확인이 남아 있다.
- 계획 코드와 실제 diff·미추적 파일에 대한 리뷰 및 작업별 커밋: **Claude 리뷰에서 실행**. 사용자 PDF·잠금 파일은 커밋 대상이 아니다. 작업별 커밋 메시지는 승인 계획 말미에 있다.
- R2·파일 업로드·프로필 사진·저장 공간 표시 등 3단계 범위와 배포 준비·Playwright 등 4단계 범위는 이번 구현에 포함하지 않았다.
