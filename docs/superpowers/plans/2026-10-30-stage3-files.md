# 3단계: 파일(이미지, 갤러리, 첨부, 프로필 사진) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **이 프로젝트의 실행 방식:** 협업 규칙(`C:/Users/user/.codex-collab/RULES.md`)에 따라 Codex가 superpowers:executing-plans 방식으로 작업 1부터 7까지 순서대로 실행한다. 계획에 적힌 코드를 그대로 옮겨 적는다. 계획이 모호하거나 틀렸거나 같은 오류에 두 번 막히면 그 자리에서 멈추고 `collab/HANDOFF.md`에 적는다.

**Goal:** 대표 이미지, 스크린샷 갤러리, 첨부 파일·폴더, 프로필 사진을 올리고 보여준다. 저장 공간 사용량도 보여준다.

**Architecture:**
- **저장:** 파일은 R2(`FILES` 바인딩)에 두고, 정보는 1단계에서 만든 `files` 테이블에 둔다.
- **업로드:** Worker를 거치는 R2 멀티파트로 한다. 순서는 시작 → 10MiB 조각 → 썸네일 → 완료이고, 실패하면 중단한다. 이미지는 브라우저에서 2000px·600px WebP로 줄여 올린다.
- **제공:** 파일은 `/files/{id}/{이름}`에서 공개 여부를 확인한 뒤 Range를 지원해 내려준다. 업로드·삭제·정리 규칙은 `src/lib/files/`의 순수 함수와 D1·R2 함수로 두고, Workers 런타임에서 Vitest로 검증한다.

**Tech Stack:** 2단계 구성 그대로다. 새 패키지는 없다(네트워크 불필요). Cloudflare R2(로컬은 miniflare가 흉내 냄)를 쓴다.

**Spec:** `docs/superpowers/specs/2026-10-27-portfolio-site-design.md`
- 3.1 상세 페이지의 대표 이미지·갤러리·첨부 목록
- 3.2 관리자 목록의 작은 이미지와 저장 공간 사용량, 수정 화면의 파일 관리
- 4.1 대표 이미지 1장·스크린샷 여러 장(순서 변경)·첨부 파일·폴더
- 4.2 프로필 사진
- 4.3 `files` 테이블
- 5.2 업로드
- 5.4 파일 제공
- 5.5 OG 이미지
- 10장 3단계

## 실행 계약

- **기준:** `main` 브랜치에서 이 계획 파일을 커밋한 지점. 그 앞은 2단계 인계 커밋 `e0796fb`이다.
- **Codex가 하지 않는 것(샌드박스 제약, 2단계와 같음):**
  - 커밋(`.git` 쓰기 불가): 각 작업의 마지막 단계는 "완료 기록"이고, 커밋은 리뷰 뒤 Claude가 작업별로 한다.
  - `npm run dev`, `npm run preview`, `npm run smoke`, 실제 브라우저 확인: Claude가 리뷰 때 샌드박스 밖에서 한다.
  - 저장소 밖 기본 경로에 쓸 수 없으면, 그 명령에서만 `npm_config_cache`와 `WRANGLER_LOG_PATH`를 임시 폴더로 지정한다.
  - `npm install`은 하지 않는다. 새 패키지가 없다.
- **완료 기준(Codex 실행분):**
  1. `npm test`: 24개 테스트 파일, 132개 테스트 통과
  2. `npm run check`: `0 errors`, `0 warnings`, `0 hints`
  3. `npm run build`: `Complete!`
  4. `collab/HANDOFF.md` 작성
- **완료 기준(Claude 리뷰분):**
  1. 마이그레이션·예시 데이터를 넣은 뒤 `npm run smoke`가 `smoke: 59 passed, 0 failed`
  2. 실제 브라우저에서 확인한다.
     - 대표 이미지, 스크린샷 2장, 첨부 1개, 프로필 사진 업로드
     - 이미지가 WebP로 줄어드는지
     - 미리보기와 홈에 그 파일들이 보이는지
- **만들거나 바꿔도 되는 파일(이 목록 밖은 건드리지 않는다):**
  - 바꿈(전체 교체):
    - 설정·문서: `wrangler.jsonc`, `vitest.config.ts`, `AGENTS.md`, `scripts/smoke.mjs`
    - 공통 코드와 테스트: `src/lib/format.ts`, `test/lib/format.test.ts`, `src/styles/admin.css`, `src/components/ProfileHero.astro`
    - 페이지와 API: `src/pages/index.astro`, `src/pages/works/[slug].astro`, `src/pages/admin/index.astro`, `src/pages/admin/works/[id]/edit.astro`, `src/pages/admin/profile.astro`, `src/pages/api/admin/works/[id]/delete.ts`
  - 새로 만듦:
    - 파일 기능: `src/lib/files/types.ts`, `src/lib/files/rules.ts`, `src/lib/files/range.ts`, `src/lib/files/group.ts`, `src/lib/files/uploads.ts`, `src/lib/files/serve.ts`, `src/lib/db/files.ts`
    - 방문자 화면: `src/components/Gallery.astro`, `src/components/AttachmentList.astro`, `src/pages/files/[id]/[name].ts`
    - 업로드 API: `src/pages/api/admin/uploads/index.ts`, `src/pages/api/admin/uploads/[id]/parts/[part].ts`, `src/pages/api/admin/uploads/[id]/thumb.ts`, `src/pages/api/admin/uploads/[id]/complete.ts`, `src/pages/api/admin/uploads/[id]/abort.ts`
    - 파일 API: `src/pages/api/admin/files/[id]/delete.ts`, `src/pages/api/admin/files/[id]/move.ts`
    - 관리자 화면: `src/components/admin/image.ts`, `src/components/admin/upload.ts`, `src/components/admin/FileManager.tsx`
    - 테스트: `test/helpers/files.ts`, `test/files/rules.test.ts`, `test/files/range.test.ts`, `test/files/group.test.ts`, `test/files/uploads.test.ts`, `test/files/serve.test.ts`
    - `collab/HANDOFF.md`
- **금지 범위:**
  - 배포 안내서, Playwright, 원격 R2·D1 설정은 4단계에서 한다.
  - `docs/` 아래 파일과 추적되지 않는 PDF는 건드리지 않는다.
  - `wrangler login`, `wrangler deploy`, `wrangler secret`, `wrangler r2 ...`, `--remote`, `git add`/`git commit`/`git push`, `npm install`, `npm approve-scripts`는 실행하지 않는다.
  - 계획에 없는 기능, 리팩터링, 디자인 변경을 하지 않는다.

## Global Constraints

- **기존 규칙:** 1·2단계 규칙을 그대로 지킨다(`AGENTS.md`).
- **용량(스펙 5.2):** 10진수 GB로 센다.
  - 파일 하나 최대 `1_000_000_000`바이트
  - 전체 합계 상한 `9_500_000_000`바이트(설정 상수)
  - 조각 `10 * 1024 * 1024`바이트
  - 사용량 표시는 `10GB 중 n.nnGB 사용`
- **이미지(스펙 5.2):** 대표·스크린샷·프로필 사진은 jpg, png, webp, gif만 받는다.
  - 브라우저에서 긴 변 2000px(표시용)과 600px(썸네일) WebP로 줄인다. 원본이 그보다 작으면 키우지 않는다.
  - gif는 원본 그대로 두고, 썸네일도 원본을 쓴다(`thumb_r2_key` = `r2_key`).
  - svg는 받지 않는다.
- **첨부(스펙 5.2):** 종류 제한이 없다. 폴더째 고르기와 끌어다 놓기 모두 폴더 경로(`relative_path`)를 유지한다. `..`가 든 경로는 거절한다.
- **파일 제공(스펙 5.4):**
  - 공개 작품의 파일과 프로필 사진만 방문자에게 준다. 비공개 작품의 파일과 업로드 중인 파일은 404다.
  - 관리자에게는 비공개 작품의 파일도 준다. 이때 캐시는 `private, no-store`, 공개 파일은 `public, max-age=86400`.
  - 머리글:
    - 첨부: `Content-Disposition: attachment`와 RFC 5987 한글 파일명
    - 이미지: `inline`
    - 공통: `X-Content-Type-Options: nosniff`, Range 지원(206/416)
- **대표 이미지와 프로필 사진은 하나만 둔다(스펙 4.1·4.3).** 새로 올리면 이전 것을 R2와 DB에서 지운다.
- **작품 삭제와 정리:**
  - 작품을 지우면 그 작품의 R2 객체와 `files` 기록을 모두 지운다.
  - 관리자 목록을 열 때마다 24시간 넘은 `uploading` 기록을 중단 처리하고 지운다.
- **R2 테스트 격리:** 같은 파일 안의 테스트끼리 격리되지 않는다. 파일 테스트는 `beforeEach`에서 `resetDb`와 `resetBucket`을 부른다.

## Review Focus

스펙이 직접 말하지 않지만 실제 사용에서 깨지기 쉬운 입력 다섯 가지와, 이를 고정하는 테스트다.

1. **한글·띄어쓰기·괄호가 든 파일 이름:** 내려받을 때 이름이 깨지면 안 된다. `test/files/serve.test.ts`의 `contentDisposition` 테스트와 smoke "공개 후 내려받기와 한글 파일명"이 고정한다.
2. **올리다 끊긴 업로드(창 닫기, 네트워크 끊김):** 기록과 조각이 쌓이면 안 된다. 클라이언트는 실패하면 중단 요청을 보내고, 서버는 24시간 지난 기록을 정리한다. `test/files/uploads.test.ts`의 "중단하면", "24시간 넘게"가 고정한다.
3. **10MiB보다 큰 파일(조각 여러 개):** 조각 순서가 섞여 와도 하나로 합쳐져야 한다. `test/files/uploads.test.ts`의 "10MiB 조각 두 개"가 고정한다.
4. **비공개 작품의 파일 주소를 아는 방문자:** 404여야 한다. `test/files/serve.test.ts`와 smoke "비공개 작품의 파일은 방문자에게 404"가 고정한다.
5. **저장 공간이 거의 찬 상태와 `..`가 든 폴더 경로:** 시작 단계에서 한국어 안내와 함께 거절해야 한다. `test/files/uploads.test.ts`의 용량 테스트와 `test/files/rules.test.ts`의 경로 테스트가 고정한다.

## 스펙과 다르게 정한 것

- 스펙 5.4의 주소 `/files/{fileId}/{원본 파일명}`에서 파일 이름 부분은 보기용이다. 파일은 id로 찾는다. 이미지는 브라우저에서 WebP로 바꾸므로, 저장된 이름의 확장자는 `.webp`가 된다.
- 첨부파일 응답에는 `Content-Security-Policy: default-src 'none'; sandbox`를 더한다. HTML 같은 첨부를 직접 열어도 스크립트가 돌지 않게 하기 위해서다.
- 스크린샷 순서는 스펙 4.1의 "순서 변경 가능"을 앞/뒤 버튼으로 구현한다(끌어서 옮기기는 하지 않는다).
- 사용량은 업로드를 시작할 때 신고한 크기로 먼저 잡는다. 완료하면 실제 크기(썸네일 포함)로 바꾼다. 동시에 여러 개를 올려도 상한을 넘지 않게 하기 위해서다.

## 사전 검증

Claude가 이 계획의 모든 파일을 현재 저장소의 복제본에서 만들어 아래 결과를 확인했다.
- `npm test`: 24개 파일, 132개 통과
- `npm run check`: 0/0/0
- `npm run build`: 성공
- `npm run smoke`: 59개 통과
- Chrome에서 실제 PNG 파일을 골라 올리는 UI 점검: 15개 통과

계획의 코드 블록은 검증한 파일 내용 그대로다.

---

### Task 1: R2 바인딩, 파일 타입과 규칙

**Files:**
- Modify(전체 교체): `wrangler.jsonc`, `vitest.config.ts`, `AGENTS.md`, `src/lib/format.ts`, `test/lib/format.test.ts`
- Create: `src/lib/files/types.ts`, `src/lib/files/rules.ts`, `src/lib/files/range.ts`, `src/lib/files/group.ts`
- Test: `test/files/rules.test.ts`, `test/files/range.test.ts`, `test/files/group.test.ts`

**Interfaces:**
- Produces: R2 바인딩 `FILES`(로컬 버킷 이름 `portfolio-files`). 테스트 환경에도 `r2Buckets: ["FILES"]`를 둔다.
- Produces(`types.ts`): `FILE_KINDS`, `FileKind = "cover" | "gallery" | "attachment" | "avatar"`, `FileRecord`, `FileView { id; kind; name; relativePath; sizeBytes; url; thumbUrl }`, `fileUrl(file, variant?: "main" | "thumb")`, `toFileView(file)`
- Produces(`rules.ts`): `MAX_FILE_BYTES`, `STORAGE_LIMIT_BYTES`, `STORAGE_TOTAL_BYTES`, `PART_SIZE`, `THUMB_MAX_BYTES`, `IMAGE_TYPES`, `IMAGE_KINDS`, `UploadStart`, `isImageKind`, `cleanFileName`, `normalizeRelativePath`, `cleanContentType`, `validateUploadStart(raw): Validation<UploadStart>`, `usageLabel(used)`, `storageFullMessage(used)`
- Produces(`range.ts`): `parseRange(header, size): ByteRange | null | "invalid"`
- Produces(`group.ts`): `groupAttachments(files: FileView[]): { folder: string; files: FileView[] }[]`
- Produces(`format.ts`): `formatBytes(bytes: number): string`

- [ ] **Step 1: 설정을 바꾼다**

`wrangler.jsonc`(전체 교체)
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
  ],
  "r2_buckets": [
    {
      "binding": "FILES",
      "bucket_name": "portfolio-files"
    }
  ]
}
```

`vitest.config.ts`(전체 교체)
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
          r2Buckets: ["FILES"],
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

`AGENTS.md`(전체 교체)
```markdown
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
```

Run: `npm run types`
Expected: 종료 코드 0. `worker-configuration.d.ts`(Git 제외)에 `FILES: R2Bucket;`이 생긴다.

- [ ] **Step 2: 실패하는 테스트를 만든다**

`test/files/rules.test.ts`
```ts
import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  PART_SIZE,
  STORAGE_LIMIT_BYTES,
  cleanFileName,
  normalizeRelativePath,
  storageFullMessage,
  usageLabel,
  validateUploadStart,
} from "../../src/lib/files/rules";

const attachment = { workId: "w1", kind: "attachment", fileName: "보고서.pdf", relativePath: "", contentType: "application/pdf", size: 1234 };

describe("업로드 규칙 상수", () => {
  it("스펙 5.2의 값을 쓴다", () => {
    expect(MAX_FILE_BYTES).toBe(1_000_000_000);
    expect(STORAGE_LIMIT_BYTES).toBe(9_500_000_000);
    expect(PART_SIZE).toBe(10 * 1024 * 1024);
  });
});

describe("validateUploadStart", () => {
  it("첨부파일은 종류 제한 없이 받고 폴더 경로를 정리한다", () => {
    expect(validateUploadStart({ ...attachment, relativePath: "자료\\디자인/./최종", contentType: "" })).toEqual({
      ok: true,
      value: { workId: "w1", kind: "attachment", fileName: "보고서.pdf", relativePath: "자료/디자인/최종", contentType: "application/octet-stream", size: 1234 },
    });
  });

  it("이미지 칸에는 jpg, png, webp, gif만 받는다", () => {
    expect(validateUploadStart({ ...attachment, kind: "gallery", contentType: "image/svg+xml" })).toEqual({
      ok: false,
      errors: { file: "jpg, png, webp, gif 이미지만 올릴 수 있어요." },
    });
    expect(validateUploadStart({ ...attachment, kind: "cover", contentType: "image/webp" }).ok).toBe(true);
  });

  it("1GB를 넘으면 거절한다", () => {
    expect(validateUploadStart({ ...attachment, size: MAX_FILE_BYTES + 1 })).toEqual({
      ok: false,
      errors: { file: "파일이 너무 커요. 1GB까지 올릴 수 있어요." },
    });
    expect(validateUploadStart({ ...attachment, size: MAX_FILE_BYTES }).ok).toBe(true);
  });

  it("프로필 사진은 작품 없이, 나머지는 작품에 붙인다", () => {
    expect(validateUploadStart({ ...attachment, kind: "avatar", contentType: "image/png" }).ok).toBe(false);
    const avatar = validateUploadStart({ ...attachment, kind: "avatar", workId: "", contentType: "image/png" });
    expect(avatar.ok && avatar.value.workId).toBeNull();
    expect(validateUploadStart({ ...attachment, workId: "" })).toEqual({
      ok: false,
      errors: { file: "파일을 붙일 대상이 올바르지 않아요." },
    });
  });

  it("상위 폴더(..)가 들어간 경로와 빈 이름은 거절한다", () => {
    expect(validateUploadStart({ ...attachment, relativePath: "a/../b" })).toEqual({
      ok: false,
      errors: { file: "폴더 경로가 올바르지 않아요." },
    });
    expect(validateUploadStart({ ...attachment, fileName: "  " })).toEqual({ ok: false, errors: { file: "파일 이름이 비어 있어요." } });
  });
});

describe("이름과 경로 정리", () => {
  it("파일 이름에서 폴더와 제어 문자를 지운다", () => {
    expect(cleanFileName("../../비밀\u0000.png")).toBe("비밀.png");
    expect(cleanFileName("C:\\Users\\me\\사진.jpg")).toBe("사진.jpg");
  });

  it("빈 칸과 점(.)을 빼고 / 로 잇는다", () => {
    expect(normalizeRelativePath("/a//b/./c/")).toBe("a/b/c");
    expect(normalizeRelativePath("")).toBe("");
    expect(normalizeRelativePath("..")).toBeNull();
  });

  it("사용량 표시", () => {
    expect(usageLabel(0)).toBe("10GB 중 0.00GB 사용");
    expect(usageLabel(1_234_000_000)).toBe("10GB 중 1.23GB 사용");
  });

  it("저장 공간 부족 안내", () => {
    expect(storageFullMessage(9_400_000_000)).toBe("저장 공간이 부족해요. 10GB 중 9.40GB를 쓰고 있어요.");
  });
});
```

`test/files/range.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { parseRange } from "../../src/lib/files/range";

describe("parseRange", () => {
  it("범위가 없거나 여러 개면 전체를 보낸다", () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("bytes=0-1,5-6", 100)).toBeNull();
  });

  it("시작-끝, 시작-, 마지막 n바이트를 해석한다", () => {
    expect(parseRange("bytes=0-9", 100)).toEqual({ offset: 0, length: 10 });
    expect(parseRange("bytes=90-", 100)).toEqual({ offset: 90, length: 10 });
    expect(parseRange("bytes=-5", 100)).toEqual({ offset: 95, length: 5 });
    expect(parseRange("bytes=95-500", 100)).toEqual({ offset: 95, length: 5 });
    expect(parseRange("bytes=-500", 100)).toEqual({ offset: 0, length: 100 });
  });

  it("만족할 수 없는 범위는 invalid", () => {
    expect(parseRange("bytes=100-", 100)).toBe("invalid");
    expect(parseRange("bytes=9-3", 100)).toBe("invalid");
    expect(parseRange("bytes=-", 100)).toBe("invalid");
    expect(parseRange("bytes=-0", 100)).toBe("invalid");
    expect(parseRange("items=0-1", 100)).toBe("invalid");
  });
});
```

`test/files/group.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { groupAttachments } from "../../src/lib/files/group";
import type { FileView } from "../../src/lib/files/types";

const view = (name: string, relativePath: string): FileView => ({
  id: name,
  kind: "attachment",
  name,
  relativePath,
  sizeBytes: 1,
  url: `/files/${name}/${name}`,
  thumbUrl: null,
});

describe("groupAttachments", () => {
  it("폴더 없는 파일을 먼저, 나머지 폴더는 가나다순으로 묶고 파일도 정렬한다", () => {
    const groups = groupAttachments([view("나.txt", "자료/최종"), view("b.zip", ""), view("가.txt", "자료/최종"), view("a.pdf", ""), view("x.png", "디자인")]);
    expect(groups.map((group) => [group.folder, group.files.map((file) => file.name)])).toEqual([
      ["", ["a.pdf", "b.zip"]],
      ["디자인", ["x.png"]],
      ["자료/최종", ["가.txt", "나.txt"]],
    ]);
  });

  it("빈 목록이면 빈 배열", () => {
    expect(groupAttachments([])).toEqual([]);
  });
});
```

`test/lib/format.test.ts`(전체 교체, `formatBytes` 테스트 추가)
```ts
import { describe, expect, it } from "vitest";
import { formatBytes, formatDate, formatPeriod, teamLabel } from "../../src/lib/format";

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

describe("formatBytes", () => {
  it("10진수 단위로 짧게 표시한다", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1_500)).toBe("1.5 KB");
    expect(formatBytes(3_400_000)).toBe("3.4 MB");
    expect(formatBytes(250_000_000)).toBe("250 MB");
    expect(formatBytes(2_500_000_000)).toBe("2.5 GB");
  });
});
```

- [ ] **Step 3: 실패를 확인한다**

Run: `npm test -- test/files/rules.test.ts test/files/range.test.ts test/files/group.test.ts test/lib/format.test.ts`
Expected: FAIL. `src/lib/files/*`를 불러오지 못하고 `formatBytes`가 없다.

- [ ] **Step 4: 구현한다**

`src/lib/files/types.ts`
```ts
export const FILE_KINDS = ["cover", "gallery", "attachment", "avatar"] as const;
export type FileKind = (typeof FILE_KINDS)[number];
export type FileStatus = "uploading" | "complete";

export interface FileRecord {
  id: string;
  workId: string | null;
  kind: FileKind;
  r2Key: string;
  thumbR2Key: string | null;
  originalName: string;
  relativePath: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  status: FileStatus;
  uploadId: string | null;
  createdAt: string;
}

// 화면과 관리자 폼에 넘기는 모양. 주소는 /files/{id}/{이름}이고 썸네일은 ?v=thumb를 붙인다.
export interface FileView {
  id: string;
  kind: FileKind;
  name: string;
  relativePath: string;
  sizeBytes: number;
  url: string;
  thumbUrl: string | null;
}

export function fileUrl(file: Pick<FileRecord, "id" | "originalName">, variant: "main" | "thumb" = "main"): string {
  const base = `/files/${file.id}/${encodeURIComponent(file.originalName)}`;
  return variant === "thumb" ? `${base}?v=thumb` : base;
}

export function toFileView(file: FileRecord): FileView {
  return {
    id: file.id,
    kind: file.kind,
    name: file.originalName,
    relativePath: file.relativePath,
    sizeBytes: file.sizeBytes,
    url: fileUrl(file),
    thumbUrl: file.thumbR2Key ? fileUrl(file, "thumb") : null,
  };
}
```

`src/lib/files/rules.ts`
```ts
import { charCount, record, text, type Validation } from "../validate/common";
import { FILE_KINDS, type FileKind } from "./types";

// 스펙 5.2. 용량은 10진수 GB(1GB = 1,000,000,000바이트)로 센다.
export const MAX_FILE_BYTES = 1_000_000_000;
export const STORAGE_LIMIT_BYTES = 9_500_000_000;
export const STORAGE_TOTAL_BYTES = 10_000_000_000;
export const PART_SIZE = 10 * 1024 * 1024;
export const THUMB_MAX_BYTES = 5_000_000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const IMAGE_KINDS: readonly FileKind[] = ["cover", "gallery", "avatar"];

export interface UploadStart {
  workId: string | null;
  kind: FileKind;
  fileName: string;
  relativePath: string;
  contentType: string;
  size: number;
}

export function isImageKind(kind: FileKind): boolean {
  return IMAGE_KINDS.includes(kind);
}

export function cleanFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  return Array.from(base.replace(/[\u0000-\u001f\u007f]/g, "").trim()).slice(0, 200).join("");
}

// 첨부 폴더 경로를 a/b 모양으로 정리한다. 상위 폴더(..)가 들어 있으면 null.
export function normalizeRelativePath(raw: string): string | null {
  const parts = raw.replace(/\\/g, "/").split("/").map((part) => part.trim()).filter((part) => part !== "" && part !== ".");
  if (parts.some((part) => part === "..")) return null;
  const joined = parts.join("/");
  return charCount(joined) > 300 ? null : joined;
}

export function cleanContentType(raw: string): string {
  const value = raw.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/.test(value) ? value : "application/octet-stream";
}

export function validateUploadStart(raw: unknown): Validation<UploadStart> {
  const input = record(raw);
  const kind = input.kind as FileKind;
  if (!FILE_KINDS.includes(kind)) return { ok: false, errors: { file: "파일 종류가 올바르지 않아요." } };
  const workId = text(input.workId);
  if (kind === "avatar" ? workId !== "" : workId === "") {
    return { ok: false, errors: { file: "파일을 붙일 대상이 올바르지 않아요." } };
  }
  const fileName = cleanFileName(text(input.fileName));
  if (fileName === "") return { ok: false, errors: { file: "파일 이름이 비어 있어요." } };
  const size = Number(input.size);
  if (!Number.isInteger(size) || size < 0) return { ok: false, errors: { file: "파일 크기가 올바르지 않아요." } };
  if (size > MAX_FILE_BYTES) return { ok: false, errors: { file: "파일이 너무 커요. 1GB까지 올릴 수 있어요." } };
  const contentType = cleanContentType(text(input.contentType));
  if (isImageKind(kind) && !(IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return { ok: false, errors: { file: "jpg, png, webp, gif 이미지만 올릴 수 있어요." } };
  }
  const relativePath = kind === "attachment" ? normalizeRelativePath(text(input.relativePath)) : "";
  if (relativePath === null) return { ok: false, errors: { file: "폴더 경로가 올바르지 않아요." } };
  return { ok: true, value: { workId: kind === "avatar" ? null : workId, kind, fileName, relativePath, contentType, size } };
}

export function usageLabel(usedBytes: number): string {
  return `10GB 중 ${(usedBytes / 1_000_000_000).toFixed(2)}GB 사용`;
}

export function storageFullMessage(usedBytes: number): string {
  return `저장 공간이 부족해요. 10GB 중 ${(usedBytes / 1_000_000_000).toFixed(2)}GB를 쓰고 있어요.`;
}
```

`src/lib/files/range.ts`
```ts
export interface ByteRange {
  offset: number;
  length: number;
}

// "bytes=시작-끝" 하나만 지원한다. 범위가 없거나 여러 개면 null(전체 전송), 만족할 수 없으면 "invalid"(416).
export function parseRange(header: string | null, size: number): ByteRange | null | "invalid" {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return header.includes(",") ? null : "invalid";
  const [, startText = "", endText = ""] = match;
  if (startText === "" && endText === "") return "invalid";
  if (startText === "") {
    const suffix = Number(endText);
    if (suffix === 0 || size === 0) return "invalid";
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }
  const start = Number(startText);
  if (start >= size) return "invalid";
  const end = endText === "" ? size - 1 : Math.min(Number(endText), size - 1);
  if (end < start) return "invalid";
  return { offset: start, length: end - start + 1 };
}
```

`src/lib/files/group.ts`
```ts
import type { FileView } from "./types";

export interface AttachmentGroup {
  folder: string;
  files: FileView[];
}

// 첨부파일을 폴더 경로별로 묶는다. 폴더 없는 파일이 먼저, 나머지는 가나다순.
export function groupAttachments(files: FileView[]): AttachmentGroup[] {
  const groups = new Map<string, FileView[]>();
  for (const file of files) groups.set(file.relativePath, [...(groups.get(file.relativePath) ?? []), file]);
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b, "ko")))
    .map(([folder, list]) => ({ folder, files: [...list].sort((x, y) => x.name.localeCompare(y.name, "ko")) }));
}
```

`src/lib/format.ts`(전체 교체)
```ts
import type { TeamType } from "./types";

export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

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

- [ ] **Step 5: 통과를 확인한다**

Run: `npm test -- test/files/rules.test.ts test/files/range.test.ts test/files/group.test.ts test/lib/format.test.ts`
Expected: `Tests  19 passed (19)`

Run: `npm test`
Expected: `Test Files  22 passed (22)`, `Tests  115 passed (115)`

- [ ] **Step 6: 완료 기록** — HANDOFF에 "작업 1 완료"와 바꾼 파일. 커밋하지 않는다.

---

### Task 2: 파일 DB 함수와 업로드 서비스

**Files:**
- Create: `src/lib/db/files.ts`, `src/lib/files/uploads.ts`, `test/helpers/files.ts`
- Test: `test/files/uploads.test.ts`

**Interfaces:**
- Consumes: `getWorkById`, `deleteWork`(2단계 `adminWorks.ts`), 작업 1의 규칙과 타입
- Produces(`db/files.ts`): `getFile`, `listWorkFiles`(complete만, 종류·순서·경로·이름 순), `listAllWorkFiles`(상태 무관), `listCoversByWork(): Map<workId, FileRecord>`, `getAvatar`, `storageUsage`, `nextSortOrder`, `insertFile`, `setThumbKey`, `markComplete`, `deleteFileRows`, `listOtherSingles`, `listStaleUploads`, `swapSortOrder`
- Produces(`files/uploads.ts`): `UploadResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 404; errors: Record<string, string> }`. 함수는 다음과 같다.
  - `startUpload(db, bucket, raw, now)`: `{ fileId, partSize }`
  - `uploadPart(db, bucket, id, partNumber, body)`: `R2UploadedPart`
  - `uploadThumb(db, bucket, id, body, contentType)`
  - `completeUpload(db, bucket, id, rawParts)`: `FileView`
  - `abortUpload`, `deleteFile`, `removeFile(db, bucket, file)`, `deleteWorkWithFiles(db, bucket, workId)`, `cleanupStaleUploads(db, bucket, now)`: 지운 개수
  - `moveGalleryFile(db, id, "up" | "down")`
- R2 키 규칙: 작품 파일은 `works/{workId}/{fileId}`, 프로필 사진은 `profile/{fileId}`, 썸네일은 `{키}.thumb`.
- Produces(테스트용): `resetBucket(bucket)`, `putCompleteFile(db, bucket, options)`

- [ ] **Step 1: 테스트 도우미와 실패하는 테스트를 만든다**

`test/helpers/files.ts`
```ts
import { insertFile } from "../../src/lib/db/files";
import type { FileKind, FileRecord } from "../../src/lib/files/types";

export async function resetBucket(bucket: R2Bucket): Promise<void> {
  for (;;) {
    const listed = await bucket.list();
    if (listed.objects.length === 0) return;
    await bucket.delete(listed.objects.map((object) => object.key));
  }
}

let sequence = 0;

// 업로드 과정을 건너뛰고 완료된 파일을 바로 만든다.
export async function putCompleteFile(
  db: D1Database,
  bucket: R2Bucket,
  options: { workId: string | null; kind: FileKind; name?: string; body?: string; contentType?: string; thumbBody?: string; relativePath?: string },
): Promise<FileRecord> {
  sequence += 1;
  const id = `file-${sequence}`;
  const key = options.workId ? `works/${options.workId}/${id}` : `profile/${id}`;
  const body = options.body ?? "본문";
  const contentType = options.contentType ?? "text/plain";
  await bucket.put(key, body, { httpMetadata: { contentType } });
  let thumbKey: string | null = null;
  if (options.thumbBody !== undefined) {
    thumbKey = `${key}.thumb`;
    await bucket.put(thumbKey, options.thumbBody, { httpMetadata: { contentType } });
  }
  const file: FileRecord = {
    id,
    workId: options.workId,
    kind: options.kind,
    r2Key: key,
    thumbR2Key: thumbKey,
    originalName: options.name ?? `${id}.txt`,
    relativePath: options.relativePath ?? "",
    contentType,
    sizeBytes: new TextEncoder().encode(body).length,
    sortOrder: sequence,
    status: "complete",
    uploadId: null,
    createdAt: "2026-10-30T00:00:00.000Z",
  };
  await insertFile(db, file);
  return file;
}
```

`test/files/uploads.test.ts`
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { getWorkById } from "../../src/lib/db/adminWorks";
import { getFile, listWorkFiles, storageUsage } from "../../src/lib/db/files";
import { PART_SIZE } from "../../src/lib/files/rules";
import {
  abortUpload,
  cleanupStaleUploads,
  completeUpload,
  deleteFile,
  deleteWorkWithFiles,
  moveGalleryFile,
  startUpload,
  uploadPart,
  uploadThumb,
} from "../../src/lib/files/uploads";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";
import { putCompleteFile, resetBucket } from "../helpers/files";

const NOW = new Date("2026-10-30T00:00:00.000Z");
const bytes = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;

async function uploadText(kind: "attachment" | "cover" | "gallery", text: string, extra: Record<string, unknown> = {}) {
  const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind, fileName: "a.txt", relativePath: "", contentType: "text/plain", size: text.length, ...extra }, NOW);
  if (!started.ok) throw new Error(JSON.stringify(started.errors));
  const part = await uploadPart(env.DB, env.FILES, started.value.fileId, 1, bytes(text));
  if (!part.ok) throw new Error("part");
  return { fileId: started.value.fileId, part: part.value };
}

beforeEach(async () => {
  await resetDb(env.DB);
  await resetBucket(env.FILES);
  await insertWorkRow(env.DB, makeWorkRow({ id: "w1", slug: "w1" }));
});

describe("업로드 흐름", () => {
  it("시작하면 uploading 기록과 조각 크기를 돌려주고, 선언한 크기를 사용량에 넣는다", async () => {
    const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "보고서.pdf", relativePath: "자료", contentType: "application/pdf", size: 1234 }, NOW);
    expect(started.ok && started.value.partSize).toBe(PART_SIZE);
    if (!started.ok) return;
    expect(await getFile(env.DB, started.value.fileId)).toMatchObject({ status: "uploading", relativePath: "자료", r2Key: `works/w1/${started.value.fileId}` });
    expect(await storageUsage(env.DB)).toBe(1234);
  });

  it("조각을 올리고 완료하면 complete가 되고 실제 크기를 남긴다", async () => {
    const { fileId, part } = await uploadText("attachment", "첨부 내용");
    const completed = await completeUpload(env.DB, env.FILES, fileId, [part]);
    expect(completed.ok && completed.value).toMatchObject({ id: fileId, kind: "attachment", url: `/files/${fileId}/a.txt`, thumbUrl: null });
    const file = await getFile(env.DB, fileId);
    expect(file).toMatchObject({ status: "complete", uploadId: null, sizeBytes: bytes("첨부 내용").byteLength });
    expect(await (await env.FILES.get(file!.r2Key))!.text()).toBe("첨부 내용");
  });

  it("10MiB 조각 두 개로 나눈 파일도 합친다", async () => {
    const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "big.bin", relativePath: "", contentType: "", size: PART_SIZE + 3 }, NOW);
    if (!started.ok) throw new Error("start");
    const first = await uploadPart(env.DB, env.FILES, started.value.fileId, 1, new Uint8Array(PART_SIZE).buffer);
    const second = await uploadPart(env.DB, env.FILES, started.value.fileId, 2, new Uint8Array(3).buffer);
    if (!first.ok || !second.ok) throw new Error("parts");
    const completed = await completeUpload(env.DB, env.FILES, started.value.fileId, [second.value, first.value]);
    expect(completed.ok && completed.value.sizeBytes).toBe(PART_SIZE + 3);
  });

  it("이미지는 썸네일 크기를 합쳐 세고, 썸네일이 없으면 원본을 썸네일로 쓴다", async () => {
    const withThumb = await uploadText("gallery", "원본", { contentType: "image/webp" });
    expect((await uploadThumb(env.DB, env.FILES, withThumb.fileId, bytes("썸"), "image/webp")).ok).toBe(true);
    await completeUpload(env.DB, env.FILES, withThumb.fileId, [withThumb.part]);
    const thumbFile = await getFile(env.DB, withThumb.fileId);
    expect(thumbFile).toMatchObject({ thumbR2Key: `${thumbFile!.r2Key}.thumb`, sizeBytes: bytes("원본").byteLength + bytes("썸").byteLength });

    const gif = await uploadText("gallery", "움짤", { contentType: "image/gif" });
    await completeUpload(env.DB, env.FILES, gif.fileId, [gif.part]);
    const gifFile = await getFile(env.DB, gif.fileId);
    expect(gifFile!.thumbR2Key).toBe(gifFile!.r2Key);
  });

  it("전체 용량을 넘기거나 없는 작품이면 거절한다", async () => {
    await env.DB.prepare(
      "INSERT INTO files (id, work_id, kind, r2_key, original_name, content_type, size_bytes, status, created_at) VALUES ('big', 'w1', 'attachment', 'k', 'big', 'x/y', 9400000000, 'complete', 'now')",
    ).run();
    expect(await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "a", contentType: "", size: 200_000_000 }, NOW)).toEqual({
      ok: false,
      status: 400,
      errors: { file: "저장 공간이 부족해요. 10GB 중 9.40GB를 쓰고 있어요." },
    });
    expect(await startUpload(env.DB, env.FILES, { workId: "none", kind: "attachment", fileName: "a", contentType: "", size: 1 }, NOW)).toEqual({
      ok: false,
      status: 404,
      errors: { file: "작품을 찾을 수 없어요." },
    });
  });

  it("대표 이미지를 새로 올리면 이전 대표 이미지를 지운다", async () => {
    const old = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "cover", contentType: "image/png" });
    const next = await uploadText("cover", "새 표지", { contentType: "image/png" });
    await completeUpload(env.DB, env.FILES, next.fileId, [next.part]);
    expect(await getFile(env.DB, old.id)).toBeNull();
    expect(await env.FILES.head(old.r2Key)).toBeNull();
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([next.fileId]);
  });

  it("중단하면 기록이 사라지고, 끝난 업로드에는 조각을 더 올릴 수 없다", async () => {
    const { fileId } = await uploadText("attachment", "중단");
    expect(await abortUpload(env.DB, env.FILES, fileId)).toEqual({ ok: true, value: null });
    expect(await getFile(env.DB, fileId)).toBeNull();
    expect(await uploadPart(env.DB, env.FILES, fileId, 1, bytes("x"))).toEqual({
      ok: false,
      status: 404,
      errors: { file: "파일을 찾을 수 없어요." },
    });
  });
});

describe("파일 정리", () => {
  it("파일 하나를 지우면 R2 객체와 썸네일도 지운다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png", thumbBody: "썸" });
    expect(await deleteFile(env.DB, env.FILES, file.id)).toEqual({ ok: true, value: null });
    expect(await env.FILES.head(file.r2Key)).toBeNull();
    expect(await env.FILES.head(file.thumbR2Key!)).toBeNull();
  });

  it("작품을 지우면 그 작품의 파일과 R2 객체가 모두 사라진다", async () => {
    const a = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "attachment" });
    const b = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "cover", contentType: "image/png" });
    expect(await deleteWorkWithFiles(env.DB, env.FILES, "w1")).toBe(true);
    expect(await getWorkById(env.DB, "w1")).toBeNull();
    expect(await env.FILES.head(a.r2Key)).toBeNull();
    expect(await env.FILES.head(b.r2Key)).toBeNull();
    expect(await storageUsage(env.DB)).toBe(0);
  });

  it("24시간 넘게 uploading으로 남은 기록만 정리한다", async () => {
    const yesterday = new Date(NOW.getTime() - 25 * 60 * 60 * 1000);
    const stale = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "old", contentType: "", size: 1 }, yesterday);
    const fresh = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "new", contentType: "", size: 1 }, NOW);
    if (!stale.ok || !fresh.ok) throw new Error("start");
    expect(await cleanupStaleUploads(env.DB, env.FILES, NOW)).toBe(1);
    expect(await getFile(env.DB, stale.value.fileId)).toBeNull();
    expect(await getFile(env.DB, fresh.value.fileId)).not.toBeNull();
  });

  it("스크린샷 순서를 위아래로 바꾼다", async () => {
    const first = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png" });
    const second = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png" });
    await moveGalleryFile(env.DB, second.id, "up");
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([second.id, first.id]);
    await moveGalleryFile(env.DB, second.id, "up");
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([second.id, first.id]);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/files/uploads.test.ts`
Expected: FAIL. `src/lib/db/files`와 `src/lib/files/uploads`를 불러오지 못한다.

- [ ] **Step 3: 구현한다**

`src/lib/db/files.ts`
```ts
import type { FileKind, FileRecord, FileStatus } from "../files/types";

interface FileRow {
  id: string;
  work_id: string | null;
  kind: string;
  r2_key: string;
  thumb_r2_key: string | null;
  original_name: string;
  relative_path: string;
  content_type: string;
  size_bytes: number;
  sort_order: number;
  status: string;
  upload_id: string | null;
  created_at: string;
}

function rowToFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    workId: row.work_id,
    kind: row.kind as FileKind,
    r2Key: row.r2_key,
    thumbR2Key: row.thumb_r2_key,
    originalName: row.original_name,
    relativePath: row.relative_path,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
    status: row.status as FileStatus,
    uploadId: row.upload_id,
    createdAt: row.created_at,
  };
}

const ORDER = "ORDER BY kind, sort_order, relative_path, original_name";

export async function getFile(db: D1Database, id: string): Promise<FileRecord | null> {
  const row = await db.prepare("SELECT * FROM files WHERE id = ?").bind(id).first<FileRow>();
  return row ? rowToFile(row) : null;
}

export async function listWorkFiles(db: D1Database, workId: string): Promise<FileRecord[]> {
  const { results } = await db
    .prepare(`SELECT * FROM files WHERE work_id = ? AND status = 'complete' ${ORDER}`)
    .bind(workId)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function listAllWorkFiles(db: D1Database, workId: string): Promise<FileRecord[]> {
  const { results } = await db.prepare("SELECT * FROM files WHERE work_id = ?").bind(workId).all<FileRow>();
  return results.map(rowToFile);
}

export async function listCoversByWork(db: D1Database): Promise<Map<string, FileRecord>> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE kind = 'cover' AND status = 'complete' AND work_id IS NOT NULL")
    .all<FileRow>();
  return new Map(results.map((row) => [row.work_id as string, rowToFile(row)]));
}

export async function getAvatar(db: D1Database): Promise<FileRecord | null> {
  const row = await db
    .prepare("SELECT * FROM files WHERE kind = 'avatar' AND status = 'complete' ORDER BY created_at DESC LIMIT 1")
    .first<FileRow>();
  return row ? rowToFile(row) : null;
}

export async function storageUsage(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COALESCE(SUM(size_bytes), 0) AS total FROM files").first<{ total: number }>();
  return row?.total ?? 0;
}

export async function nextSortOrder(db: D1Database, workId: string | null, kind: FileKind): Promise<number> {
  const row = await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM files WHERE work_id IS ? AND kind = ?")
    .bind(workId, kind)
    .first<{ next: number }>();
  return row?.next ?? 0;
}

export async function insertFile(db: D1Database, file: FileRecord): Promise<void> {
  await db
    .prepare(
      `INSERT INTO files (id, work_id, kind, r2_key, thumb_r2_key, original_name, relative_path, content_type, size_bytes, sort_order, status, upload_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      file.id,
      file.workId,
      file.kind,
      file.r2Key,
      file.thumbR2Key,
      file.originalName,
      file.relativePath,
      file.contentType,
      file.sizeBytes,
      file.sortOrder,
      file.status,
      file.uploadId,
      file.createdAt,
    )
    .run();
}

export async function setThumbKey(db: D1Database, id: string, thumbKey: string): Promise<void> {
  await db.prepare("UPDATE files SET thumb_r2_key = ? WHERE id = ?").bind(thumbKey, id).run();
}

export async function markComplete(db: D1Database, id: string, sizeBytes: number, thumbKey: string | null): Promise<void> {
  await db
    .prepare("UPDATE files SET status = 'complete', upload_id = NULL, size_bytes = ?, thumb_r2_key = ? WHERE id = ?")
    .bind(sizeBytes, thumbKey, id)
    .run();
}

export async function deleteFileRows(db: D1Database, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.batch(ids.map((id) => db.prepare("DELETE FROM files WHERE id = ?").bind(id)));
}

export async function listOtherSingles(db: D1Database, file: FileRecord): Promise<FileRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE kind = ? AND work_id IS ? AND id != ? AND status = 'complete'")
    .bind(file.kind, file.workId, file.id)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function listStaleUploads(db: D1Database, before: string): Promise<FileRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE status = 'uploading' AND created_at < ?")
    .bind(before)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function swapSortOrder(db: D1Database, a: FileRecord, b: FileRecord): Promise<void> {
  await db.batch([
    db.prepare("UPDATE files SET sort_order = ? WHERE id = ?").bind(b.sortOrder, a.id),
    db.prepare("UPDATE files SET sort_order = ? WHERE id = ?").bind(a.sortOrder, b.id),
  ]);
}
```

`src/lib/files/uploads.ts`
```ts
import { deleteWork, getWorkById } from "../db/adminWorks";
import * as files from "../db/files";
import {
  IMAGE_TYPES,
  MAX_FILE_BYTES,
  PART_SIZE,
  STORAGE_LIMIT_BYTES,
  THUMB_MAX_BYTES,
  cleanContentType,
  isImageKind,
  storageFullMessage,
  validateUploadStart,
} from "./rules";
import { toFileView, type FileRecord, type FileView } from "./types";

export type UploadResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 404; errors: Record<string, string> };

const NOT_FOUND = { ok: false, status: 404, errors: { file: "파일을 찾을 수 없어요." } } as const;
const fail = (message: string) => ({ ok: false, status: 400, errors: { file: message } }) as const;
const done = <T>(value: T) => ({ ok: true, value }) as const;

function objectKey(workId: string | null, fileId: string): string {
  return workId ? `works/${workId}/${fileId}` : `profile/${fileId}`;
}

async function pendingFile(db: D1Database, id: string): Promise<(FileRecord & { uploadId: string }) | null> {
  const file = await files.getFile(db, id);
  return file && file.status === "uploading" && file.uploadId ? { ...file, uploadId: file.uploadId } : null;
}

function parseParts(raw: unknown): R2UploadedPart[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 10_000) return null;
  const parts: R2UploadedPart[] = [];
  for (const item of raw) {
    const { partNumber, etag } = (item ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(partNumber) || (partNumber as number) < 1 || typeof etag !== "string" || etag === "") return null;
    parts.push({ partNumber: partNumber as number, etag });
  }
  return parts.sort((a, b) => a.partNumber - b.partNumber);
}

export async function startUpload(
  db: D1Database,
  bucket: R2Bucket,
  raw: unknown,
  now: Date,
): Promise<UploadResult<{ fileId: string; partSize: number }>> {
  const check = validateUploadStart(raw);
  if (!check.ok) return { ok: false, status: 400, errors: check.errors };
  const start = check.value;
  if (start.workId !== null && !(await getWorkById(db, start.workId))) {
    return { ok: false, status: 404, errors: { file: "작품을 찾을 수 없어요." } };
  }
  const used = await files.storageUsage(db);
  if (used + start.size > STORAGE_LIMIT_BYTES) return fail(storageFullMessage(used));

  const id = crypto.randomUUID();
  const key = objectKey(start.workId, id);
  const upload = await bucket.createMultipartUpload(key, { httpMetadata: { contentType: start.contentType } });
  await files.insertFile(db, {
    id,
    workId: start.workId,
    kind: start.kind,
    r2Key: key,
    thumbR2Key: null,
    originalName: start.fileName,
    relativePath: start.relativePath,
    contentType: start.contentType,
    sizeBytes: start.size,
    sortOrder: await files.nextSortOrder(db, start.workId, start.kind),
    status: "uploading",
    uploadId: upload.uploadId,
    createdAt: now.toISOString(),
  });
  return done({ fileId: id, partSize: PART_SIZE });
}

export async function uploadPart(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  partNumber: number,
  body: ArrayBuffer,
): Promise<UploadResult<R2UploadedPart>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) return fail("조각 번호가 올바르지 않아요.");
  if (body.byteLength > PART_SIZE) return fail("조각이 너무 커요.");
  const part = await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).uploadPart(partNumber, body);
  return done({ partNumber: part.partNumber, etag: part.etag });
}

export async function uploadThumb(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<UploadResult<null>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  const type = cleanContentType(contentType);
  if (!isImageKind(file.kind) || !(IMAGE_TYPES as readonly string[]).includes(type)) return fail("썸네일은 이미지에만 붙일 수 있어요.");
  if (body.byteLength > THUMB_MAX_BYTES) return fail("썸네일이 너무 커요.");
  const thumbKey = `${file.r2Key}.thumb`;
  await bucket.put(thumbKey, body, { httpMetadata: { contentType: type } });
  await files.setThumbKey(db, id, thumbKey);
  return done(null);
}

export async function removeFile(db: D1Database, bucket: R2Bucket, file: FileRecord): Promise<void> {
  if (file.status === "uploading" && file.uploadId) {
    try {
      await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).abort();
    } catch {
      // 이미 끝났거나 사라진 업로드
    }
  }
  await bucket.delete([file.r2Key, `${file.r2Key}.thumb`]);
  await files.deleteFileRows(db, [file.id]);
}

export async function completeUpload(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  rawParts: unknown,
): Promise<UploadResult<FileView>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  const parts = parseParts(rawParts);
  if (!parts) return fail("업로드 조각 정보가 올바르지 않아요.");
  const object = await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).complete(parts);
  if (object.size > MAX_FILE_BYTES) {
    await removeFile(db, bucket, { ...file, status: "complete" });
    return fail("파일이 너무 커요. 1GB까지 올릴 수 있어요.");
  }
  let size = object.size;
  let thumbKey = file.thumbR2Key;
  if (thumbKey) size += (await bucket.head(thumbKey))?.size ?? 0;
  else if (isImageKind(file.kind)) thumbKey = file.r2Key;
  await files.markComplete(db, id, size, thumbKey);
  if (file.kind === "cover" || file.kind === "avatar") {
    for (const old of await files.listOtherSingles(db, file)) await removeFile(db, bucket, old);
  }
  return done(toFileView((await files.getFile(db, id))!));
}

export async function abortUpload(db: D1Database, bucket: R2Bucket, id: string): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file || file.status !== "uploading") return NOT_FOUND;
  await removeFile(db, bucket, file);
  return done(null);
}

export async function deleteFile(db: D1Database, bucket: R2Bucket, id: string): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file) return NOT_FOUND;
  await removeFile(db, bucket, file);
  return done(null);
}

export async function deleteWorkWithFiles(db: D1Database, bucket: R2Bucket, workId: string): Promise<boolean> {
  for (const file of await files.listAllWorkFiles(db, workId)) await removeFile(db, bucket, file);
  return deleteWork(db, workId);
}

export async function cleanupStaleUploads(db: D1Database, bucket: R2Bucket, now: Date): Promise<number> {
  const before = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const stale = await files.listStaleUploads(db, before);
  for (const file of stale) await removeFile(db, bucket, file);
  return stale.length;
}

export async function moveGalleryFile(db: D1Database, id: string, direction: "up" | "down"): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file || file.kind !== "gallery" || file.status !== "complete" || !file.workId) return NOT_FOUND;
  const gallery = (await files.listWorkFiles(db, file.workId)).filter((item) => item.kind === "gallery");
  const index = gallery.findIndex((item) => item.id === id);
  const other = gallery[direction === "up" ? index - 1 : index + 1];
  if (other) await files.swapSortOrder(db, file, other);
  return done(null);
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- test/files/uploads.test.ts`
Expected: `Tests  11 passed (11)`

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 2 완료". 커밋하지 않는다.

---

### Task 3: 파일 제공

**Files:**
- Create: `src/lib/files/serve.ts`, `src/pages/files/[id]/[name].ts`
- Test: `test/files/serve.test.ts`

**Interfaces:**
- Produces: `contentDisposition(kind, name): string`, `serveFile(db, bucket, request, id, isAdmin): Promise<Response>`
- 경로 `/files/{id}/{name}`의 GET은 `serveFile(env.DB, env.FILES, request, params.id, locals.isAdmin)`을 돌려준다.

- [ ] **Step 1: 실패하는 테스트를 만든다**

`test/files/serve.test.ts`
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { contentDisposition, serveFile } from "../../src/lib/files/serve";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";
import { putCompleteFile, resetBucket } from "../helpers/files";

const request = (id: string, init: { thumb?: boolean; range?: string } = {}) =>
  new Request(`https://example.com/files/${id}/x${init.thumb ? "?v=thumb" : ""}`, {
    headers: init.range ? { Range: init.range } : {},
  });

beforeEach(async () => {
  await resetDb(env.DB);
  await resetBucket(env.FILES);
  await insertWorkRow(env.DB, makeWorkRow({ id: "pub", slug: "pub", is_public: 1 }));
  await insertWorkRow(env.DB, makeWorkRow({ id: "priv", slug: "priv", is_public: 0 }));
});

describe("serveFile", () => {
  it("공개 작품의 첨부파일은 내려받기 머리글과 함께 누구에게나 준다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", name: "최종 보고서.pdf", body: "PDF", contentType: "application/pdf" });
    const res = await serveFile(env.DB, env.FILES, request(file.id), file.id, false);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("PDF");
    expect(res.headers.get("Content-Disposition")).toBe(
      "attachment; filename=\"__ ___.pdf\"; filename*=UTF-8''%EC%B5%9C%EC%A2%85%20%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf",
    );
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
  });

  it("비공개 작품의 파일은 방문자에게 404, 관리자에게는 캐시 없이 준다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "priv", kind: "gallery", contentType: "image/png" });
    expect((await serveFile(env.DB, env.FILES, request(file.id), file.id, false)).status).toBe(404);
    const admin = await serveFile(env.DB, env.FILES, request(file.id), file.id, true);
    expect(admin.status).toBe(200);
    expect(admin.headers.get("Cache-Control")).toBe("private, no-store");
    expect(admin.headers.get("Content-Disposition")).toMatch(/^inline;/);
  });

  it("프로필 사진은 항상 공개하고, 썸네일 주소는 썸네일을 준다", async () => {
    const avatar = await putCompleteFile(env.DB, env.FILES, { workId: null, kind: "avatar", body: "큰 사진", thumbBody: "작은 사진", contentType: "image/webp" });
    expect(await (await serveFile(env.DB, env.FILES, request(avatar.id), avatar.id, false)).text()).toBe("큰 사진");
    expect(await (await serveFile(env.DB, env.FILES, request(avatar.id, { thumb: true }), avatar.id, false)).text()).toBe("작은 사진");
  });

  it("업로드 중이거나 없는 파일은 404", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment" });
    await env.DB.prepare("UPDATE files SET status = 'uploading' WHERE id = ?").bind(file.id).run();
    expect((await serveFile(env.DB, env.FILES, request(file.id), file.id, true)).status).toBe(404);
    expect((await serveFile(env.DB, env.FILES, request("none"), "none", true)).status).toBe(404);
  });

  it("Range 요청에 206과 Content-Range로 답하고, 범위가 틀리면 416", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", body: "0123456789" });
    const partial = await serveFile(env.DB, env.FILES, request(file.id, { range: "bytes=2-5" }), file.id, false);
    expect(partial.status).toBe(206);
    expect(partial.headers.get("Content-Range")).toBe("bytes 2-5/10");
    expect(await partial.text()).toBe("2345");
    const invalid = await serveFile(env.DB, env.FILES, request(file.id, { range: "bytes=20-" }), file.id, false);
    expect(invalid.status).toBe(416);
    expect(invalid.headers.get("Content-Range")).toBe("bytes */10");
  });
});

describe("contentDisposition", () => {
  it("이미지는 inline, 첨부는 attachment", () => {
    expect(contentDisposition("cover", "a.png")).toBe("inline; filename=\"a.png\"; filename*=UTF-8''a.png");
    expect(contentDisposition("attachment", "it's (1).zip")).toBe(
      "attachment; filename=\"it's (1).zip\"; filename*=UTF-8''it%27s%20%281%29.zip",
    );
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- test/files/serve.test.ts`
Expected: FAIL. `src/lib/files/serve`를 불러오지 못한다.

- [ ] **Step 3: 구현한다**

`src/lib/files/serve.ts`
```ts
import { getWorkById } from "../db/adminWorks";
import { getFile } from "../db/files";
import { parseRange } from "./range";
import type { FileKind } from "./types";

// RFC 5987: 한글 파일명은 filename*=UTF-8''로 보내고, 옛 브라우저용 filename에는 ASCII만 남긴다.
export function contentDisposition(kind: FileKind, name: string): string {
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `${kind === "attachment" ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "X-Content-Type-Options": "nosniff" } });
}

export async function serveFile(
  db: D1Database,
  bucket: R2Bucket,
  request: Request,
  id: string,
  isAdmin: boolean,
): Promise<Response> {
  const file = await getFile(db, id);
  if (!file || file.status !== "complete") return notFound();
  let isPublic = file.kind === "avatar";
  if (file.workId) {
    const work = await getWorkById(db, file.workId);
    if (!work) return notFound();
    isPublic = work.isPublic;
  }
  if (!isPublic && !isAdmin) return notFound();

  const key = new URL(request.url).searchParams.get("v") === "thumb" ? (file.thumbR2Key ?? file.r2Key) : file.r2Key;
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": isPublic ? "public, max-age=86400" : "private, no-store",
    "Content-Disposition": contentDisposition(file.kind, file.originalName),
    "X-Content-Type-Options": "nosniff",
  });
  if (file.kind === "attachment") headers.set("Content-Security-Policy", "default-src 'none'; sandbox");

  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    const head = await bucket.head(key);
    if (!head) return notFound();
    const range = parseRange(rangeHeader, head.size);
    if (range === "invalid") {
      headers.set("Content-Range", `bytes */${head.size}`);
      return new Response(null, { status: 416, headers });
    }
    if (range) {
      const part = await bucket.get(key, { range });
      if (!part) return notFound();
      headers.set("Content-Type", part.httpMetadata?.contentType ?? file.contentType);
      headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`);
      headers.set("ETag", part.httpEtag);
      return new Response(part.body, { status: 206, headers });
    }
  }

  const object = await bucket.get(key);
  if (!object) return notFound();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? file.contentType);
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}
```

`src/pages/files/[id]/[name].ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { serveFile } from "../../../lib/files/serve";

// 스펙 5.4. 주소의 파일 이름은 보기용이고, 파일은 id로 찾는다.
export const GET: APIRoute = async ({ params, request, locals }) =>
  serveFile(env.DB, env.FILES, request, params.id ?? "", locals.isAdmin);
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test`
Expected: `Test Files  24 passed (24)`, `Tests  132 passed (132)`

- [ ] **Step 5: 완료 기록** — HANDOFF에 "작업 3 완료". 커밋하지 않는다.

---

### Task 4: 업로드와 파일 관리 API

**Files:**
- Create: `src/pages/api/admin/uploads/index.ts`, `src/pages/api/admin/uploads/[id]/parts/[part].ts`, `src/pages/api/admin/uploads/[id]/thumb.ts`, `src/pages/api/admin/uploads/[id]/complete.ts`, `src/pages/api/admin/uploads/[id]/abort.ts`
- Create: `src/pages/api/admin/files/[id]/delete.ts`, `src/pages/api/admin/files/[id]/move.ts`
- Modify(전체 교체): `src/pages/api/admin/works/[id]/delete.ts`(R2 파일까지 지움)

**Interfaces:**
- **응답:**

  | API | 응답 |
  |---|---|
  | 업로드 시작 | `201 { fileId, partSize }` |
  | 조각 | `200 { partNumber, etag }` |
  | 썸네일 | `200 { ok: true }` |
  | 완료 | `200 { file: FileView }` |
  | 중단·파일 삭제·순서 바꾸기 | `200 { ok: true }` |
  | 실패 | `400` 또는 `404`와 `{ errors: { file } }` |

- 모든 경로는 `/api/admin/` 아래라서 2단계 미들웨어가 로그인과 Origin을 검사한다.
- 이 작업에는 단위 테스트가 없다. 동작은 Claude가 smoke(작업 7)로 확인한다.

- [ ] **Step 1: API를 만든다**

`src/pages/api/admin/uploads/index.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { startUpload } from "../../../../lib/files/uploads";
import { jsonError, readJson } from "../../../../lib/http";

export const POST: APIRoute = async ({ request }) => {
  const result = await startUpload(env.DB, env.FILES, await readJson(request), new Date());
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json(result.value, { status: 201 });
};
```

`src/pages/api/admin/uploads/[id]/parts/[part].ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadPart } from "../../../../../../lib/files/uploads";
import { jsonError } from "../../../../../../lib/http";

export const PUT: APIRoute = async ({ params, request }) => {
  const result = await uploadPart(env.DB, env.FILES, params.id ?? "", Number(params.part), await request.arrayBuffer());
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json(result.value);
};
```

`src/pages/api/admin/uploads/[id]/thumb.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadThumb } from "../../../../../lib/files/uploads";
import { jsonError } from "../../../../../lib/http";

export const PUT: APIRoute = async ({ params, request }) => {
  const result = await uploadThumb(env.DB, env.FILES, params.id ?? "", await request.arrayBuffer(), request.headers.get("Content-Type") ?? "");
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ ok: true });
};
```

`src/pages/api/admin/uploads/[id]/complete.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { completeUpload } from "../../../../../lib/files/uploads";
import { jsonError, readJson } from "../../../../../lib/http";

export const POST: APIRoute = async ({ params, request }) => {
  const body = (await readJson(request)) as { parts?: unknown } | null;
  const result = await completeUpload(env.DB, env.FILES, params.id ?? "", body?.parts);
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ file: result.value });
};
```

`src/pages/api/admin/uploads/[id]/abort.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { abortUpload } from "../../../../../lib/files/uploads";
import { jsonError } from "../../../../../lib/http";

export const POST: APIRoute = async ({ params }) => {
  const result = await abortUpload(env.DB, env.FILES, params.id ?? "");
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ ok: true });
};
```

`src/pages/api/admin/files/[id]/delete.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { deleteFile } from "../../../../../lib/files/uploads";
import { jsonError } from "../../../../../lib/http";

export const POST: APIRoute = async ({ params }) => {
  const result = await deleteFile(env.DB, env.FILES, params.id ?? "");
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ ok: true });
};
```

`src/pages/api/admin/files/[id]/move.ts`
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { moveGalleryFile } from "../../../../../lib/files/uploads";
import { jsonError, readJson } from "../../../../../lib/http";

export const POST: APIRoute = async ({ params, request }) => {
  const body = (await readJson(request)) as { direction?: unknown } | null;
  if (body?.direction !== "up" && body?.direction !== "down") return jsonError(400, { file: "옮길 방향이 올바르지 않아요." });
  const result = await moveGalleryFile(env.DB, params.id ?? "", body.direction);
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ ok: true });
};
```

`src/pages/api/admin/works/[id]/delete.ts`(전체 교체)
```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { deleteWorkWithFiles } from "../../../../../lib/files/uploads";

export const POST: APIRoute = async ({ params, redirect }) => {
  await deleteWorkWithFiles(env.DB, env.FILES, params.id ?? "");
  return redirect("/admin?deleted=1", 303);
};
```

- [ ] **Step 2: 타입 검사와 빌드를 확인한다**

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: `Complete!`

- [ ] **Step 3: 완료 기록** — HANDOFF에 "작업 4 완료"와 "smoke는 Claude 리뷰에서 실행". 커밋하지 않는다.

---

### Task 5: 방문자 화면(대표 이미지, 갤러리, 첨부, 프로필 사진)

**Files:**
- Create: `src/components/Gallery.astro`, `src/components/AttachmentList.astro`
- Modify(전체 교체): `src/pages/index.astro`, `src/components/ProfileHero.astro`, `src/pages/works/[slug].astro`

**Interfaces:**
- `Gallery` props: `{ images: FileView[]; title: string }`. 썸네일을 4:3 격자로 보여준다. 누르면 `<dialog>`로 크게 본다. 스크립트가 없으면 링크가 원본을 새 탭으로 연다.
- `AttachmentList` props: `{ files: FileView[] }`. 폴더별로 묶고, 파일 이름(내려받기 링크)과 크기를 보여준다.
- `ProfileHero`에 `avatarUrl?: string | null`을 더한다.
- 홈:
  - 대표작 카드는 표시용, 전체 목록 카드는 썸네일 이미지를 쓴다.
  - OG 이미지는 프로필 사진이다.
- 상세:
  - 머리 아래에 대표 이미지를 둔다(최대 높이 520px, 위 기준으로 자름).
  - 설명 아래에 "스크린샷", 맨 아래에 "첨부 파일"을 둔다.
  - OG 이미지는 대표 이미지다.

- [ ] **Step 1: 구성 요소를 만든다**

`src/components/Gallery.astro`
```astro
---
import type { FileView } from "../lib/files/types";

interface Props {
  images: FileView[];
  title: string;
}

const { images, title } = Astro.props;
---

<div class="gallery" data-gallery>
  {
    images.map((image, index) => (
      <a class="gallery-item" href={image.url} target="_blank" rel="noopener">
        <img src={image.thumbUrl ?? image.url} alt={`${title} 스크린샷 ${index + 1}`} loading="lazy" />
      </a>
    ))
  }
</div>
<dialog class="lightbox" data-lightbox>
  <img alt="" />
  <button type="button" class="lightbox-close" aria-label="닫기">×</button>
</dialog>

<script>
  // 스크립트가 없으면 링크가 원본 이미지를 새 탭에서 연다.
  const dialog = document.querySelector<HTMLDialogElement>("[data-lightbox]");
  const big = dialog?.querySelector("img");
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-gallery] .gallery-item")) {
    link.addEventListener("click", (event) => {
      if (!dialog || !big) return;
      event.preventDefault();
      big.src = link.href;
      big.alt = link.querySelector("img")?.alt ?? "";
      dialog.showModal();
    });
  }
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog || (event.target as HTMLElement).closest(".lightbox-close")) dialog.close();
  });
</script>

<style>
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: 12px;
  }
  .gallery-item {
    display: block;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
  }
  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }
  .gallery-item:hover img {
    transform: scale(1.03);
  }
  .lightbox {
    max-width: min(96vw, 1400px);
    max-height: 92vh;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
  }
  .lightbox::backdrop {
    background: rgba(10, 12, 16, 0.85);
  }
  .lightbox img {
    display: block;
    max-width: 100%;
    max-height: 92vh;
    margin: 0 auto;
    border-radius: var(--radius);
  }
  .lightbox-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: var(--ink);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
  }
</style>
```

`src/components/AttachmentList.astro`
```astro
---
import { formatBytes } from "../lib/format";
import { groupAttachments } from "../lib/files/group";
import type { FileView } from "../lib/files/types";

interface Props {
  files: FileView[];
}

const groups = groupAttachments(Astro.props.files);
---

<div class="attachments">
  {
    groups.map((group) => (
      <div class="group">
        {group.folder && <p class="folder">{group.folder}</p>}
        <ul>
          {group.files.map((file) => (
            <li>
              <a href={file.url} download={file.name}>
                {file.name}
              </a>
              <span class="size">{formatBytes(file.sizeBytes)}</span>
            </li>
          ))}
        </ul>
      </div>
    ))
  }
</div>

<style>
  .attachments {
    display: grid;
    gap: 16px;
  }
  .folder {
    margin-bottom: 6px;
    color: var(--muted);
    font-size: 14px;
    font-weight: 700;
  }
  ul {
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--line);
    list-style: none;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  a {
    color: var(--accent);
    font-weight: 600;
  }
  .size {
    color: var(--muted);
    font-size: 14px;
  }
</style>
```

`src/components/ProfileHero.astro`(전체 교체)
```astro
---
import type { Profile } from "../lib/types";

interface Props {
  profile: Profile;
  avatarUrl?: string | null;
}

const { profile, avatarUrl = null } = Astro.props;
const hasContacts = profile.email !== null || profile.githubUrl !== null || profile.links.length > 0;
---

<header class="hero">
  <div class="container">
    {avatarUrl && <img class="avatar" src={avatarUrl} alt={`${profile.name} 프로필 사진`} />}
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
  .avatar {
    width: 96px;
    height: 96px;
    margin-bottom: 20px;
    border-radius: 50%;
    object-fit: cover;
    background: var(--surface);
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

- [ ] **Step 2: 페이지를 바꾼다**

`src/pages/index.astro`(전체 교체)
```astro
---
import { env } from "cloudflare:workers";
import EmptyState from "../components/EmptyState.astro";
import FilterBar from "../components/FilterBar.astro";
import ProfileHero from "../components/ProfileHero.astro";
import WorkCard from "../components/WorkCard.astro";
import BaseLayout from "../layouts/BaseLayout.astro";
import { getAvatar, listCoversByWork } from "../lib/db/files";
import { getProfile } from "../lib/db/profile";
import { listPublicWorks } from "../lib/db/works";
import { fileUrl } from "../lib/files/types";
import { applyFilters, emptyStateMessage, filterOptions, hasActiveFilters, parseFilters } from "../lib/works/filter";

const [profile, works, covers, avatar] = await Promise.all([
  getProfile(env.DB),
  listPublicWorks(env.DB),
  listCoversByWork(env.DB),
  getAvatar(env.DB),
]);
const coverFor = (workId: string, variant: "main" | "thumb") => {
  const cover = covers.get(workId);
  return cover ? fileUrl(cover, variant) : null;
};
const filters = parseFilters(Astro.url.searchParams);
const featured = works.filter((work) => work.isFeatured);
const visible = applyFilters(works, filters);
const options = filterOptions(works);
const description = profile.headline ?? `${profile.name}의 작업과 수상 기록을 모은 포트폴리오`;
---

<BaseLayout
  title={`${profile.name} | 포트폴리오`}
  description={description}
  ownerName={profile.name}
  image={avatar ? fileUrl(avatar) : null}
>
  <ProfileHero profile={profile} avatarUrl={avatar ? fileUrl(avatar, "thumb") : null} />
  <main>
    {
      featured.length > 0 && (
        <section class="section container" aria-labelledby="featured-title">
          <h2 id="featured-title" class="section-title">대표작</h2>
          <div class="grid grid-featured">
            {featured.map((work) => (
              <WorkCard work={work} list="featured" coverUrl={coverFor(work.id, "main")} />
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
              <WorkCard work={work} list="all" coverUrl={coverFor(work.id, "thumb")} />
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

`src/pages/works/[slug].astro`(전체 교체)
```astro
---
import { env } from "cloudflare:workers";
import AttachmentList from "../../components/AttachmentList.astro";
import Gallery from "../../components/Gallery.astro";
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getProfile } from "../../lib/db/profile";
import { getWorkBySlug } from "../../lib/db/adminWorks";
import { listWorkFiles } from "../../lib/db/files";
import { getPublicWorkBySlug } from "../../lib/db/works";
import { toFileView } from "../../lib/files/types";
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
const fileViews = (await listWorkFiles(env.DB, work.id)).map(toFileView);
const cover = fileViews.find((file) => file.kind === "cover") ?? null;
const gallery = fileViews.filter((file) => file.kind === "gallery");
const attachments = fileViews.filter((file) => file.kind === "attachment");
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

<BaseLayout title={`${work.title} | ${profile.name}`} description={summaryOf(work)} ownerName={profile.name} noindex={preview} image={cover?.url ?? null}>
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

    {cover && <img class="cover-image" src={cover.url} alt={`${work.title} 대표 이미지`} />}

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
      gallery.length > 0 && (
        <section class="block">
          <h2>스크린샷</h2>
          <Gallery images={gallery} title={work.title} />
        </section>
      )
    }

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
    {
      attachments.length > 0 && (
        <section class="block">
          <h2>첨부 파일</h2>
          <AttachmentList files={attachments} />
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
  .cover-image {
    width: 100%;
    max-height: 520px;
    margin-top: 32px;
    object-fit: cover;
    object-position: top;
    border: 1px solid var(--line);
    border-radius: var(--radius);
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

- [ ] **Step 3: 타입 검사와 빌드를 확인한다**

Run: `npm run check`
Expected: `0 errors`

Run: `npm run build`
Expected: `Complete!`

- [ ] **Step 4: 완료 기록** — HANDOFF에 "작업 5 완료". 커밋하지 않는다.

---

### Task 6: 관리자 파일 관리 화면

**Files:**
- Create: `src/components/admin/image.ts`, `src/components/admin/upload.ts`, `src/components/admin/FileManager.tsx`
- Modify(전체 교체): `src/styles/admin.css`, `src/pages/admin/index.astro`, `src/pages/admin/works/[id]/edit.astro`, `src/pages/admin/profile.astro`

**Interfaces:**
- `processImage(file): Promise<{ main; thumb; contentType; name }>`(`image.ts`).
  - 긴 변 `DISPLAY_MAX = 2000`, `THUMB_MAX = 600`으로 줄인다. gif는 그대로 둔다.
  - WebP를 못 만드는 브라우저는 PNG를 쓴다.
- `upload.ts`:
  - `uploadFile(job, onProgress): Promise<FileView>`. 실패하면 중단 요청을 보내고 `UploadError`를 던진다.
  - `filesFromDrop(items)`: 끌어다 놓은 폴더를 펼친다.
  - `folderOf(file)`: `webkitRelativePath`에서 폴더 부분을 뽑는다.
- `FileManager` props: `{ mode: "work" | "avatar"; workId: string | null; initialFiles: FileView[]; usedBytes: number }`
  - 동시에 최대 3개를 올리고, 파일마다 진행 막대를 보여준다. 실패하면 "다시 시도"/"빼기" 버튼이 나온다.
  - 입력 칸 id는 `cover-input`, `gallery-input`, `attachment-input`, `folder-input`, `avatar-input`이다. Claude의 브라우저 점검이 이 id를 쓴다.
- 관리자 목록:
  - 열 때 `cleanupStaleUploads`를 부른다.
  - `저장 공간 10GB 중 n.nnGB 사용`과 대표 이미지 썸네일을 보여준다.

- [ ] **Step 1: 업로드 도우미와 파일 관리 컴포넌트를 만든다**

`src/components/admin/image.ts`
```ts
// 스펙 5.2: 이미지는 브라우저에서 긴 변 2000px(표시용)과 600px(썸네일) WebP로 줄인다. 작으면 키우지 않는다. gif는 그대로.
export const DISPLAY_MAX = 2000;
export const THUMB_MAX = 600;

export interface ProcessedImage {
  main: Blob;
  thumb: Blob | null;
  contentType: string;
  name: string;
}

function resize(bitmap: ImageBitmap, maxSide: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("이미지를 줄이지 못했어요."))), "image/webp", 0.85),
  );
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (file.type === "image/gif") return { main: file, thumb: null, contentType: "image/gif", name: file.name };
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const main = await resize(bitmap, DISPLAY_MAX);
    const thumb = await resize(bitmap, THUMB_MAX);
    // WebP를 못 만드는 브라우저는 PNG를 돌려준다. 실제 형식으로 이름과 종류를 맞춘다.
    const extension = main.type === "image/webp" ? "webp" : "png";
    return { main, thumb, contentType: main.type, name: `${file.name.replace(/\.[^.]+$/, "")}.${extension}` };
  } finally {
    bitmap.close();
  }
}
```

`src/components/admin/upload.ts`
```ts
import type { FileKind, FileView } from "../../lib/files/types";
import { processImage } from "./image";

export class UploadError extends Error {}

export interface UploadJobInput {
  file: File;
  kind: FileKind;
  relativePath: string;
  workId: string | null;
}

interface CallResult {
  status: number;
  data: Record<string, unknown> | null;
}

async function call(url: string, init: RequestInit): Promise<CallResult> {
  const response = await fetch(url, { credentials: "same-origin", ...init });
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: response.status, data };
}

function errorText(result: CallResult, fallback: string): string {
  const errors = result.data?.errors as Record<string, string> | undefined;
  if (result.status === 401) return "로그인이 풀렸어요. 다시 로그인한 뒤 올려 주세요.";
  return errors?.file ?? fallback;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

// 시작 → 조각(10MiB씩 순서대로) → 썸네일 → 완료. 중간에 실패하면 중단 요청을 보낸다.
export async function uploadFile(job: UploadJobInput, onProgress: (ratio: number) => void): Promise<FileView> {
  let main: Blob = job.file;
  let thumb: Blob | null = null;
  let name = job.file.name;
  let contentType = job.file.type;
  if (job.kind !== "attachment") {
    try {
      ({ main, thumb, name, contentType } = await processImage(job.file));
    } catch {
      throw new UploadError("이미지를 읽지 못했어요. jpg, png, webp, gif인지 확인해 주세요.");
    }
  }

  const start = await call("/api/admin/uploads", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      workId: job.workId ?? "",
      kind: job.kind,
      fileName: name,
      relativePath: job.relativePath,
      contentType,
      size: main.size + (thumb?.size ?? 0),
    }),
  });
  if (start.status !== 201) throw new UploadError(errorText(start, "올리기를 시작하지 못했어요."));
  const fileId = String(start.data?.fileId);
  const partSize = Number(start.data?.partSize);

  try {
    const total = Math.max(1, Math.ceil(main.size / partSize));
    const parts: unknown[] = [];
    for (let index = 0; index < total; index += 1) {
      const result = await call(`/api/admin/uploads/${fileId}/parts/${index + 1}`, {
        method: "PUT",
        body: main.slice(index * partSize, (index + 1) * partSize),
      });
      if (result.status !== 200) throw new UploadError(errorText(result, "올리는 중에 끊겼어요. 다시 시도해 주세요."));
      parts.push(result.data);
      onProgress(((index + 1) / total) * 0.95);
    }
    if (thumb) {
      const result = await call(`/api/admin/uploads/${fileId}/thumb`, {
        method: "PUT",
        headers: { "Content-Type": thumb.type },
        body: thumb,
      });
      if (result.status !== 200) throw new UploadError(errorText(result, "썸네일을 올리지 못했어요."));
    }
    const done = await call(`/api/admin/uploads/${fileId}/complete`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ parts }),
    });
    if (done.status !== 200) throw new UploadError(errorText(done, "마무리하지 못했어요. 다시 시도해 주세요."));
    onProgress(1);
    return done.data?.file as FileView;
  } catch (error) {
    await fetch(`/api/admin/uploads/${fileId}/abort`, { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    throw error instanceof UploadError ? error : new UploadError("올리는 중에 끊겼어요. 다시 시도해 주세요.");
  }
}

// 끌어다 놓은 폴더를 펼친다. relativePath는 파일이 든 폴더 경로(파일 이름 제외).
export async function filesFromDrop(items: DataTransferItemList): Promise<{ file: File; relativePath: string }[]> {
  const out: { file: File; relativePath: string }[] = [];
  const readAll = async (reader: FileSystemDirectoryReader) => {
    const all: FileSystemEntry[] = [];
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
      if (batch.length === 0) return all;
      all.push(...batch);
    }
  };
  const walk = async (entry: FileSystemEntry, folder: string): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
      out.push({ file, relativePath: folder });
    } else if (entry.isDirectory) {
      const next = folder ? `${folder}/${entry.name}` : entry.name;
      for (const child of await readAll((entry as FileSystemDirectoryEntry).createReader())) await walk(child, next);
    }
  };
  const entries = Array.from(items)
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => entry !== null);
  for (const entry of entries) await walk(entry, "");
  return out;
}

export function folderOf(file: File): string {
  const path = file.webkitRelativePath;
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}
```

`src/components/admin/FileManager.tsx`
```tsx
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { formatBytes } from "../../lib/format";
import { groupAttachments } from "../../lib/files/group";
import { usageLabel } from "../../lib/files/rules";
import type { FileKind, FileView } from "../../lib/files/types";
import { UploadError, filesFromDrop, folderOf, uploadFile } from "./upload";

interface Props {
  mode: "work" | "avatar";
  workId: string | null;
  initialFiles: FileView[];
  usedBytes: number;
}

interface Job {
  key: number;
  file: File;
  kind: FileKind;
  relativePath: string;
  status: "waiting" | "uploading" | "error";
  progress: number;
  error: string | null;
}

const MAX_PARALLEL = 3;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export default function FileManager({ mode, workId, initialFiles, usedBytes }: Props) {
  const [files, setFiles] = useState<FileView[]>(initialFiles);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [used, setUsed] = useState(usedBytes);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const running = useRef(new Set<number>());
  const filesRef = useRef(files);
  filesRef.current = files;
  const nextKey = useRef(1);

  const update = (key: number, patch: Partial<Job>) =>
    setJobs((current) => current.map((job) => (job.key === key ? { ...job, ...patch } : job)));

  const enqueue = (kind: FileKind, items: { file: File; relativePath: string }[]) => {
    if (items.length === 0) return;
    setNotice(null);
    setJobs((current) => [
      ...current,
      ...items.map((item) => ({ key: nextKey.current++, ...item, kind, status: "waiting" as const, progress: 0, error: null })),
    ]);
  };

  async function run(job: Job) {
    update(job.key, { status: "uploading", progress: 0, error: null });
    try {
      const view = await uploadFile({ file: job.file, kind: job.kind, relativePath: job.relativePath, workId }, (progress) =>
        update(job.key, { progress }),
      );
      const single = job.kind === "cover" || job.kind === "avatar";
      const replaced = single ? filesRef.current.filter((file) => file.kind === job.kind) : [];
      setUsed((value) => value + view.sizeBytes - replaced.reduce((sum, file) => sum + file.sizeBytes, 0));
      setFiles((current) => [...current.filter((file) => !(single && file.kind === job.kind)), view]);
      setJobs((current) => current.filter((item) => item.key !== job.key));
    } catch (error) {
      update(job.key, { status: "error", error: error instanceof UploadError ? error.message : "올리지 못했어요. 다시 시도해 주세요." });
    } finally {
      running.current.delete(job.key);
    }
  }

  useEffect(() => {
    const active = jobs.filter((job) => job.status === "uploading").length;
    const ready = jobs.filter((job) => job.status === "waiting" && !running.current.has(job.key)).slice(0, Math.max(0, MAX_PARALLEL - active));
    for (const job of ready) {
      running.current.add(job.key);
      void run(job);
    }
  }, [jobs]);

  const pick = (kind: FileKind, withFolders = false) => (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    enqueue(kind, picked.map((file) => ({ file, relativePath: withFolders ? folderOf(file) : "" })));
    event.target.value = "";
  };

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    enqueue("attachment", await filesFromDrop(event.dataTransfer.items));
  }

  async function remove(file: FileView) {
    if (!window.confirm(`'${file.name}'을(를) 지울까요? 되돌릴 수 없어요.`)) return;
    const response = await fetch(`/api/admin/files/${file.id}/delete`, { method: "POST", credentials: "same-origin" }).catch(() => null);
    if (!response?.ok) {
      setNotice("지우지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setFiles((current) => current.filter((item) => item.id !== file.id));
    setUsed((value) => Math.max(0, value - file.sizeBytes));
  }

  async function move(file: FileView, direction: "up" | "down") {
    const gallery = files.filter((item) => item.kind === "gallery");
    const index = gallery.findIndex((item) => item.id === file.id);
    const other = gallery[direction === "up" ? index - 1 : index + 1];
    if (!other) return;
    const response = await fetch(`/api/admin/files/${file.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
      credentials: "same-origin",
    }).catch(() => null);
    if (!response?.ok) {
      setNotice("순서를 바꾸지 못했어요.");
      return;
    }
    setFiles((current) => current.map((item) => (item.id === file.id ? other : item.id === other.id ? file : item)));
  }

  const cover = files.find((file) => file.kind === (mode === "avatar" ? "avatar" : "cover")) ?? null;
  const gallery = files.filter((file) => file.kind === "gallery");
  const attachments = files.filter((file) => file.kind === "attachment");
  const singleKind: FileKind = mode === "avatar" ? "avatar" : "cover";

  return (
    <section className="form-section file-manager" aria-label="파일">
      <div className="file-head">
        <h2>{mode === "avatar" ? "프로필 사진" : "파일"}</h2>
        <p className="admin-muted" data-usage>
          저장 공간 {usageLabel(used)}
        </p>
      </div>
      {notice && (
        <p className="alert alert-error" role="alert">
          {notice}
        </p>
      )}

      <div className="file-block">
        {mode === "work" && <h3>대표 이미지</h3>}
        <div className="single-image">
          {cover ? <img src={cover.thumbUrl ?? cover.url} alt="" /> : <span className="single-empty">아직 없어요</span>}
          <div className="file-actions">
            <label className="btn btn-small">
              {cover ? "바꾸기" : "이미지 고르기"}
              <input id={`${singleKind}-input`} type="file" accept={IMAGE_ACCEPT} hidden onChange={pick(singleKind)} />
            </label>
            {cover && (
              <button type="button" className="btn btn-small btn-danger" onClick={() => remove(cover)}>
                지우기
              </button>
            )}
          </div>
        </div>
      </div>

      {mode === "work" && (
        <>
          <div className="file-block">
            <h3>스크린샷</h3>
            {gallery.length > 0 && (
              <ul className="file-grid">
                {gallery.map((file, index) => (
                  <li key={file.id}>
                    <img src={file.thumbUrl ?? file.url} alt={file.name} />
                    <div className="file-grid-actions">
                      <button type="button" aria-label="앞으로" disabled={index === 0} onClick={() => move(file, "up")}>
                        ←
                      </button>
                      <button type="button" aria-label="뒤로" disabled={index === gallery.length - 1} onClick={() => move(file, "down")}>
                        →
                      </button>
                      <button type="button" aria-label={`${file.name} 지우기`} onClick={() => remove(file)}>
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <label className="btn btn-small">
              이미지 추가
              <input id="gallery-input" type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={pick("gallery")} />
            </label>
          </div>

          <div className="file-block">
            <h3>첨부 파일·폴더</h3>
            <div
              className={dragging ? "dropzone dragging" : "dropzone"}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <p>여기에 파일이나 폴더를 끌어다 놓으세요. 파일 하나에 1GB까지 올릴 수 있어요.</p>
              <div className="file-actions">
                <label className="btn btn-small">
                  파일 고르기
                  <input id="attachment-input" type="file" multiple hidden onChange={pick("attachment")} />
                </label>
                <label className="btn btn-small">
                  폴더 고르기
                  <input
                    id="folder-input"
                    type="file"
                    multiple
                    hidden
                    ref={(element) => {
                      element?.setAttribute("webkitdirectory", "");
                    }}
                    onChange={pick("attachment", true)}
                  />
                </label>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="attachment-groups">
                {groupAttachments(attachments).map((group) => (
                  <div key={group.folder}>
                    {group.folder && <p className="attachment-folder">{group.folder}</p>}
                    <ul className="attachment-list">
                      {group.files.map((file) => (
                        <li key={file.id}>
                          <a href={file.url}>{file.name}</a>
                          <span className="admin-muted">{formatBytes(file.sizeBytes)}</span>
                          <button type="button" className="btn btn-small btn-danger" onClick={() => remove(file)}>
                            지우기
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {jobs.length > 0 && (
        <ul className="upload-list" aria-live="polite">
          {jobs.map((job) => (
            <li key={job.key} className={job.status === "error" ? "upload-row upload-error" : "upload-row"}>
              <span className="upload-name">{job.relativePath ? `${job.relativePath}/${job.file.name}` : job.file.name}</span>
              {job.status === "error" ? (
                <>
                  <span className="field-error">{job.error}</span>
                  <button type="button" className="btn btn-small" onClick={() => update(job.key, { status: "waiting", error: null })}>
                    다시 시도
                  </button>
                  <button type="button" className="btn btn-small" onClick={() => setJobs((current) => current.filter((item) => item.key !== job.key))}>
                    빼기
                  </button>
                </>
              ) : (
                <progress max={1} value={job.status === "waiting" ? 0 : job.progress}>
                  {Math.round(job.progress * 100)}%
                </progress>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 스타일과 페이지를 바꾼다**

`src/styles/admin.css`(전체 교체)
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

/* 3단계: 파일 관리 */
.file-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.file-head h2 {
  margin-bottom: 0;
}

.file-block {
  margin-bottom: 24px;
}

.file-block h3 {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
}

.file-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.single-image {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.single-image img,
.single-empty {
  width: 160px;
  height: 120px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  object-fit: cover;
}

.single-empty {
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 14px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}

.file-grid li {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.file-grid img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--surface);
}

.file-grid-actions {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--line);
}

.file-grid-actions button {
  flex: 1;
  height: 32px;
  border: 0;
  background: #fff;
  color: var(--body);
  font-size: 15px;
  cursor: pointer;
}

.file-grid-actions button:hover:not(:disabled) {
  background: var(--surface);
}

.file-grid-actions button:disabled {
  color: #c4c8cf;
  cursor: default;
}

.dropzone {
  display: grid;
  gap: 12px;
  justify-items: start;
  padding: 18px;
  border: 2px dashed #d3d7de;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: 14px;
}

.dropzone.dragging {
  border-color: var(--accent);
  background: #eef1fd;
}

.attachment-groups {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.attachment-folder {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.attachment-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.attachment-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  font-size: 15px;
}

.attachment-list a {
  flex: 1;
  min-width: 0;
  color: var(--ink);
  font-weight: 600;
}

.upload-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-size: 14px;
}

.upload-row progress {
  flex: 1;
  min-width: 140px;
  height: 8px;
  accent-color: var(--accent);
}

.upload-name {
  flex-basis: 100%;
  color: var(--ink);
  font-weight: 600;
}

.upload-error {
  background: #fdecec;
}

.work-row-info {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.work-row-thumb {
  flex: none;
  width: 64px;
  height: 48px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--surface);
}

.work-row-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

`src/pages/admin/index.astro`(전체 교체)
```astro
---
import { env } from "cloudflare:workers";
import AdminLayout from "../../layouts/AdminLayout.astro";
import { countFilesByWork, listAllWorks } from "../../lib/db/adminWorks";
import { listCoversByWork, storageUsage } from "../../lib/db/files";
import { usageLabel } from "../../lib/files/rules";
import { fileUrl } from "../../lib/files/types";
import { cleanupStaleUploads } from "../../lib/files/uploads";
import { formatDate } from "../../lib/format";
import { sortDateOf } from "../../lib/works/sort";

await cleanupStaleUploads(env.DB, env.FILES, new Date());
const [works, fileCounts, covers, used] = await Promise.all([
  listAllWorks(env.DB),
  countFilesByWork(env.DB),
  listCoversByWork(env.DB),
  storageUsage(env.DB),
]);
const publicCount = works.filter((work) => work.isPublic).length;
const deleted = Astro.url.searchParams.get("deleted") === "1";
---

<AdminLayout title="작품" current="works">
  <div class="admin-toolbar">
    <p class="admin-muted" data-usage>작품 {works.length}개 · 공개 {publicCount}개 · 저장 공간 {usageLabel(used)}</p>
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
            <div class="work-row-info">
              <div class="work-row-thumb">
                {covers.get(work.id) && <img src={fileUrl(covers.get(work.id)!, "thumb")} alt="" loading="lazy" />}
              </div>
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

`src/pages/admin/works/[id]/edit.astro`(전체 교체)
```astro
---
import { env } from "cloudflare:workers";
import FileManager from "../../../../components/admin/FileManager";
import WorkForm from "../../../../components/admin/WorkForm";
import AdminLayout from "../../../../layouts/AdminLayout.astro";
import { getWorkById, listTagSuggestions } from "../../../../lib/db/adminWorks";
import { listWorkFiles, storageUsage } from "../../../../lib/db/files";
import { toFileView } from "../../../../lib/files/types";
import { workToInput } from "../../../../lib/validate/work";

const work = await getWorkById(env.DB, Astro.params.id ?? "");
if (!work) {
  return Astro.rewrite("/404");
}
const [suggestions, files, used] = await Promise.all([
  listTagSuggestions(env.DB),
  listWorkFiles(env.DB, work.id),
  storageUsage(env.DB),
]);
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
  <div style="margin-top: 28px">
    <FileManager client:only="react" mode="work" workId={work.id} initialFiles={files.map(toFileView)} usedBytes={used} />
  </div>
</AdminLayout>
```

`src/pages/admin/profile.astro`(전체 교체)
```astro
---
import { env } from "cloudflare:workers";
import FileManager from "../../components/admin/FileManager";
import ProfileForm from "../../components/admin/ProfileForm";
import AdminLayout from "../../layouts/AdminLayout.astro";
import { getAvatar, storageUsage } from "../../lib/db/files";
import { getProfile } from "../../lib/db/profile";
import { toFileView } from "../../lib/files/types";
import { profileToInput } from "../../lib/validate/profile";

const [profile, avatar, used] = await Promise.all([getProfile(env.DB), getAvatar(env.DB), storageUsage(env.DB)]);
---

<AdminLayout title="자기소개" current="profile">
  <FileManager client:only="react" mode="avatar" workId={null} initialFiles={avatar ? [toFileView(avatar)] : []} usedBytes={used} />
  <ProfileForm client:only="react" initial={profileToInput(profile)} />
</AdminLayout>
```

- [ ] **Step 3: 타입 검사와 빌드를 확인한다**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`

Run: `npm run build`
Expected: `Complete!`

- [ ] **Step 4: 완료 기록** — HANDOFF에 "작업 6 완료"와 "화면 확인은 Claude 리뷰에서 실행". 커밋하지 않는다.

---

### Task 7: 화면 점검 확장, 최종 검증과 인계

**Files:**
- Modify(전체 교체): `scripts/smoke.mjs`(파일 점검 14개 추가, 모두 59개)
- Create: `collab/HANDOFF.md`(처음부터 다시 쓴다)

- [ ] **Step 1: smoke를 바꾸고 문법을 확인한다**

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


async function raw(pathname, { method = "GET", cookie, body, type, headers: extra = {} } = {}) {
  const headers = { ...extra };
  if (cookie) headers.Cookie = cookie;
  if (method !== "GET") headers.Origin = base;
  if (type) headers["Content-Type"] = type;
  const res = await fetch(base + pathname, { method, headers, body, redirect: "manual" });
  const html = await res.text();
  let data = null;
  try {
    data = JSON.parse(html);
  } catch {
    // 파일 본문
  }
  return { status: res.status, html, data, headers: res.headers };
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


  // ---- 3단계: 파일 ----
  const fileWork = await request("/api/admin/works", { method: "POST", cookie, json: workBody("스모크 파일 작품") });
  const fileWorkId = fileWork.data?.id;
  const attachmentText = "첨부 파일 내용";
  const startAttachment = await request("/api/admin/uploads", {
    method: "POST",
    cookie,
    json: {
      workId: fileWorkId,
      kind: "attachment",
      fileName: "최종 보고서.txt",
      relativePath: "자료/최종",
      contentType: "text/plain",
      size: new TextEncoder().encode(attachmentText).length,
    },
  });
  check("업로드 시작 201", startAttachment.status === 201 && startAttachment.data?.partSize === 10485760, JSON.stringify(startAttachment.data));
  const attachmentId = startAttachment.data?.fileId;
  const attachmentPart = await raw(`/api/admin/uploads/${attachmentId}/parts/1`, { method: "PUT", cookie, body: attachmentText, type: "application/octet-stream" });
  check("조각 업로드 200", attachmentPart.status === 200 && typeof attachmentPart.data?.etag === "string", JSON.stringify(attachmentPart.data));
  const attachmentDone = await request(`/api/admin/uploads/${attachmentId}/complete`, { method: "POST", cookie, json: { parts: [attachmentPart.data] } });
  const attachmentUrl = attachmentDone.data?.file?.url ?? "/none";
  check(
    "업로드 완료와 파일 주소",
    attachmentDone.status === 200 && attachmentUrl === `/files/${attachmentId}/${encodeURIComponent("최종 보고서.txt")}`,
    JSON.stringify(attachmentDone.data),
  );
  check("비공개 작품의 파일은 방문자에게 404", (await raw(attachmentUrl)).status === 404);
  await request(`/api/admin/works/${fileWorkId}/flags`, { method: "POST", cookie, form: { isPublic: "1" } });
  const downloaded = await raw(attachmentUrl);
  check(
    "공개 후 내려받기와 한글 파일명",
    downloaded.status === 200 &&
      downloaded.html === attachmentText &&
      (downloaded.headers.get("content-disposition") ?? "").startsWith("attachment;") &&
      (downloaded.headers.get("content-disposition") ?? "").includes("filename*=UTF-8''%EC%B5%9C%EC%A2%85"),
    String(downloaded.headers.get("content-disposition")),
  );
  const ranged = await raw(attachmentUrl, { headers: { Range: "bytes=0-2" } });
  check("Range 요청 206", ranged.status === 206 && ranged.headers.get("content-range") === "bytes 0-2/20", `${ranged.status} ${ranged.headers.get("content-range")}`);

  const startImage = await request("/api/admin/uploads", {
    method: "POST",
    cookie,
    json: { workId: fileWorkId, kind: "gallery", fileName: "화면.webp", relativePath: "", contentType: "image/webp", size: 17 },
  });
  const imageId = startImage.data?.fileId;
  const imagePart = await raw(`/api/admin/uploads/${imageId}/parts/1`, { method: "PUT", cookie, body: "IMG-MAIN", type: "application/octet-stream" });
  const imageThumb = await raw(`/api/admin/uploads/${imageId}/thumb`, { method: "PUT", cookie, body: "IMG-THUMB", type: "image/webp" });
  const imageDone = await request(`/api/admin/uploads/${imageId}/complete`, { method: "POST", cookie, json: { parts: [imagePart.data] } });
  check("이미지와 썸네일 업로드", imageThumb.status === 200 && imageDone.status === 200 && Boolean(imageDone.data?.file?.thumbUrl), JSON.stringify(imageDone.data));
  const thumbGet = await raw(imageDone.data?.file?.thumbUrl ?? "/none");
  check("썸네일 주소는 썸네일을 준다", thumbGet.status === 200 && thumbGet.html === "IMG-THUMB");
  const svg = await request("/api/admin/uploads", {
    method: "POST",
    cookie,
    json: { workId: fileWorkId, kind: "gallery", fileName: "x.svg", contentType: "image/svg+xml", size: 10 },
  });
  check("svg 이미지는 거절", svg.status === 400 && svg.data?.errors?.file === "jpg, png, webp, gif 이미지만 올릴 수 있어요.");
  const tooBig = await request("/api/admin/uploads", {
    method: "POST",
    cookie,
    json: { workId: fileWorkId, kind: "attachment", fileName: "big.zip", contentType: "application/zip", size: 1_000_000_001 },
  });
  check("1GB 넘는 파일은 거절", tooBig.status === 400 && tooBig.data?.errors?.file === "파일이 너무 커요. 1GB까지 올릴 수 있어요.");
  const fileDetail = await raw(workPath("스모크-파일-작품"));
  check(
    "상세 페이지에 스크린샷과 폴더별 첨부",
    fileDetail.status === 200 && fileDetail.html.includes("스크린샷") && fileDetail.html.includes("자료/최종") && fileDetail.html.includes("최종 보고서.txt"),
  );
  const usageList = await raw("/admin", { cookie });
  check("관리자 목록에 저장 공간 표시", /저장 공간 10GB 중 \d+\.\d{2}GB 사용/.test(usageList.html));
  const removedFile = await request(`/api/admin/files/${attachmentId}/delete`, { method: "POST", cookie });
  check("파일 하나 지우기", removedFile.status === 200 && (await raw(attachmentUrl)).status === 404);
  await request(`/api/admin/works/${fileWorkId}/delete`, { method: "POST", cookie });
  check("작품을 지우면 그 파일도 404", (await raw(imageDone.data?.file?.url ?? "/none")).status === 404);

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

Run: `node --check scripts/smoke.mjs`
Expected: 출력 없이 종료 코드 0

- [ ] **Step 2: 전체 검증을 실행한다**

Run: `npm test`
Expected: `Test Files  24 passed (24)`, `Tests  132 passed (132)`

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`

Run: `npm run build`
Expected: `Complete!`

- [ ] **Step 3: `collab/HANDOFF.md`를 쓴다**

협업 규칙 6번 형식으로 쓴다.
- 실행한 계획 파일
- 작업별 완료 여부와 바꾼 파일
- 계획과 다르게 한 부분(없으면 "없음")
- `git status --short --untracked-files=all` 결과
- 검증 명령의 종료 코드와 결과 줄
- 미실행 항목: smoke, 브라우저 확인, 커밋은 "Claude 리뷰에서 실행"으로 적는다.
- 막힌 지점, 질문, 남은 위험

---

## Claude 리뷰 순서(샌드박스 밖)

1. `HANDOFF.md`와 실제 변경을 확인한다. 계획의 코드 블록과 파일을 줄바꿈만 맞춰 대조한다.
2. `npm test`, `npm run check`, `npm run build`를 다시 실행한다.
3. 다음을 차례로 실행한다. 기대 결과는 `smoke: 59 passed, 0 failed`.
   - `npm run db:migrate:local`
   - `npm run db:seed:local`
   - `npm run smoke`
4. 배포용 빌드 미리보기를 띄우고 Chrome으로 확인한다. 1280px와 375px 폭에서 본다.
   - 실제 이미지·텍스트 파일 업로드(대표, 스크린샷 2장, 첨부, 프로필 사진)
   - 미리보기 페이지와 홈 표시
5. 문제가 없으면 작업별로 커밋한다.

| 작업 | 커밋 메시지 |
|---|---|
| 1 | `feat: add R2 binding and file rules` |
| 2 | `feat: add file records and multipart upload service` |
| 3 | `feat: serve files with access rules and range support` |
| 4 | `feat: add upload and file management API` |
| 5 | `feat: show cover, gallery, attachments and avatar` |
| 6 | `feat: add admin file manager with image resizing` |
| 7 | `test: add file checks to smoke and stage 3 handoff` |

---

## 수정 작업 1 (2026-10-30, 사용자 승인)

**이유:** 첫 실행에서 Codex가 작업 2의 계획 코드에 동시 업로드 경쟁 문제가 있음을 찾고 멈췄다.
- **경쟁 문제:** `startUpload`가 사용량을 읽고(`storageUsage`) 확인한 뒤, 따로 기록을 넣는다(`insertFile`). 사용량이 9.4GB일 때 100MB 업로드 두 개가 동시에 시작하면 둘 다 확인을 통과해 합계가 9.6GB가 된다(상한 9.5GB).
- **같이 고친 빈틈:** 완료할 때 실제 크기를 1GB 상한하고만 비교했다. 시작할 때 크기를 작게 알리고 더 큰 파일을 올리면 용량 상한을 피할 수 있었다.

**고친 방법:**
- **원자적 예약:** 사용량 확인, 순서 번호 계산, 기록 저장을 SQL 한 문장(`INSERT … SELECT … WHERE 합계 + 크기 <= 상한`)으로 묶었다. 새 함수는 `reserveFile`이다. D1은 한 문장을 한 번에 처리하므로, 동시에 시작해도 상한을 넘지 않는다.
- **업로드 순서:** 기록을 먼저 예약하고(`upload_id`는 비움), R2 멀티파트를 연 뒤 `setUploadId`로 업로드 번호를 채운다. 멀티파트를 열다 실패하면 예약한 기록을 지운다.
- **완료 확인:** 완료할 때 실제 크기(원본 + 썸네일)가 처음 알린 크기보다 크면 파일을 지우고 거절한다. 관리자 화면(`upload.ts`)은 이미 원본과 썸네일 크기를 합쳐 알리므로 바꿀 것이 없다.

**바뀐 점(아래 내용이 앞의 작업 설명보다 우선한다):**

1. **작업 2 Step 1부터 시작한다.** 작업 1은 Claude가 다시 검증하고 커밋했다(`7445d92`). 작업 1 파일은 다시 만들지 않는다.
2. **작업 2의 세 파일은 앞의 코드 대신 이 절의 코드를 그대로 쓴다.**
   - Step 1: `test/files/uploads.test.ts`(아래 코드). `test/helpers/files.ts`는 앞의 코드 그대로다.
   - Step 3: `src/lib/db/files.ts`, `src/lib/files/uploads.ts`(아래 코드)
3. **작업 2의 Interfaces가 바뀐다.** `db/files.ts`에서 `nextSortOrder`를 뺐다. 대신 두 함수를 더했다.
   - `reserveFile(db, file, limitBytes): Promise<boolean>`: 상한을 넘으면 아무것도 넣지 않고 `false`를 돌려준다.
   - `setUploadId(db, id, uploadId)`
4. **기대 테스트 수가 바뀐다.** 업로드 테스트가 2개 늘었다(동시 시작, 알린 크기 초과).
   - 작업 2 Step 4: `Tests  13 passed (13)`
   - 작업 3 마지막 단계, 작업 7 Step 2, 실행 계약 완료 기준: `Test Files  24 passed (24)`, `Tests  134 passed (134)`
   - smoke는 그대로 `smoke: 59 passed, 0 failed`다.
5. **작업 7 Step 3:** `collab/HANDOFF.md`를 처음부터 다시 쓴다. 첫 실행(작업 2에서 멈춤)과 이번 실행을 모두 요약한다. 커밋은 하지 않는다.

**Claude 사전 검증:** 이 절의 코드를 반영한 복제본에서 다음을 확인했다.
- `npm test` 24개 파일, 134개 통과(세 번 반복)
- `npm run check` `0 errors`, `0 warnings`, `0 hints`
- `npm run build` `Complete!`
- `smoke: 59 passed, 0 failed`
- 실제 브라우저 업로드 확인 15개 통과

`src/lib/db/files.ts`
```ts
import type { FileKind, FileRecord, FileStatus } from "../files/types";

interface FileRow {
  id: string;
  work_id: string | null;
  kind: string;
  r2_key: string;
  thumb_r2_key: string | null;
  original_name: string;
  relative_path: string;
  content_type: string;
  size_bytes: number;
  sort_order: number;
  status: string;
  upload_id: string | null;
  created_at: string;
}

function rowToFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    workId: row.work_id,
    kind: row.kind as FileKind,
    r2Key: row.r2_key,
    thumbR2Key: row.thumb_r2_key,
    originalName: row.original_name,
    relativePath: row.relative_path,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
    status: row.status as FileStatus,
    uploadId: row.upload_id,
    createdAt: row.created_at,
  };
}

const ORDER = "ORDER BY kind, sort_order, relative_path, original_name";

export async function getFile(db: D1Database, id: string): Promise<FileRecord | null> {
  const row = await db.prepare("SELECT * FROM files WHERE id = ?").bind(id).first<FileRow>();
  return row ? rowToFile(row) : null;
}

export async function listWorkFiles(db: D1Database, workId: string): Promise<FileRecord[]> {
  const { results } = await db
    .prepare(`SELECT * FROM files WHERE work_id = ? AND status = 'complete' ${ORDER}`)
    .bind(workId)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function listAllWorkFiles(db: D1Database, workId: string): Promise<FileRecord[]> {
  const { results } = await db.prepare("SELECT * FROM files WHERE work_id = ?").bind(workId).all<FileRow>();
  return results.map(rowToFile);
}

export async function listCoversByWork(db: D1Database): Promise<Map<string, FileRecord>> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE kind = 'cover' AND status = 'complete' AND work_id IS NOT NULL")
    .all<FileRow>();
  return new Map(results.map((row) => [row.work_id as string, rowToFile(row)]));
}

export async function getAvatar(db: D1Database): Promise<FileRecord | null> {
  const row = await db
    .prepare("SELECT * FROM files WHERE kind = 'avatar' AND status = 'complete' ORDER BY created_at DESC LIMIT 1")
    .first<FileRow>();
  return row ? rowToFile(row) : null;
}

export async function storageUsage(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COALESCE(SUM(size_bytes), 0) AS total FROM files").first<{ total: number }>();
  return row?.total ?? 0;
}

export async function insertFile(db: D1Database, file: FileRecord): Promise<void> {
  await db
    .prepare(
      `INSERT INTO files (id, work_id, kind, r2_key, thumb_r2_key, original_name, relative_path, content_type, size_bytes, sort_order, status, upload_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      file.id,
      file.workId,
      file.kind,
      file.r2Key,
      file.thumbR2Key,
      file.originalName,
      file.relativePath,
      file.contentType,
      file.sizeBytes,
      file.sortOrder,
      file.status,
      file.uploadId,
      file.createdAt,
    )
    .run();
}

// 사용량 확인, 순서 번호, 기록 저장을 한 문장으로 한다. 동시에 여러 개를 올려도 상한을 넘지 않는다.
// 상한을 넘으면 아무것도 넣지 않고 false를 돌려준다.
export async function reserveFile(
  db: D1Database,
  file: Omit<FileRecord, "sortOrder" | "uploadId" | "status">,
  limitBytes: number,
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT INTO files (id, work_id, kind, r2_key, thumb_r2_key, original_name, relative_path, content_type, size_bytes, sort_order, status, upload_id, created_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?,
         (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM files WHERE work_id IS ? AND kind = ?),
         'uploading', NULL, ?
       WHERE (SELECT COALESCE(SUM(size_bytes), 0) FROM files) + ? <= ?`,
    )
    .bind(
      file.id,
      file.workId,
      file.kind,
      file.r2Key,
      file.thumbR2Key,
      file.originalName,
      file.relativePath,
      file.contentType,
      file.sizeBytes,
      file.workId,
      file.kind,
      file.createdAt,
      file.sizeBytes,
      limitBytes,
    )
    .run();
  return result.meta.changes === 1;
}

export async function setUploadId(db: D1Database, id: string, uploadId: string): Promise<void> {
  await db.prepare("UPDATE files SET upload_id = ? WHERE id = ?").bind(uploadId, id).run();
}

export async function setThumbKey(db: D1Database, id: string, thumbKey: string): Promise<void> {
  await db.prepare("UPDATE files SET thumb_r2_key = ? WHERE id = ?").bind(thumbKey, id).run();
}

export async function markComplete(db: D1Database, id: string, sizeBytes: number, thumbKey: string | null): Promise<void> {
  await db
    .prepare("UPDATE files SET status = 'complete', upload_id = NULL, size_bytes = ?, thumb_r2_key = ? WHERE id = ?")
    .bind(sizeBytes, thumbKey, id)
    .run();
}

export async function deleteFileRows(db: D1Database, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.batch(ids.map((id) => db.prepare("DELETE FROM files WHERE id = ?").bind(id)));
}

export async function listOtherSingles(db: D1Database, file: FileRecord): Promise<FileRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE kind = ? AND work_id IS ? AND id != ? AND status = 'complete'")
    .bind(file.kind, file.workId, file.id)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function listStaleUploads(db: D1Database, before: string): Promise<FileRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE status = 'uploading' AND created_at < ?")
    .bind(before)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function swapSortOrder(db: D1Database, a: FileRecord, b: FileRecord): Promise<void> {
  await db.batch([
    db.prepare("UPDATE files SET sort_order = ? WHERE id = ?").bind(b.sortOrder, a.id),
    db.prepare("UPDATE files SET sort_order = ? WHERE id = ?").bind(a.sortOrder, b.id),
  ]);
}
```

`src/lib/files/uploads.ts`
```ts
import { deleteWork, getWorkById } from "../db/adminWorks";
import * as files from "../db/files";
import {
  IMAGE_TYPES,
  MAX_FILE_BYTES,
  PART_SIZE,
  STORAGE_LIMIT_BYTES,
  THUMB_MAX_BYTES,
  cleanContentType,
  isImageKind,
  storageFullMessage,
  validateUploadStart,
} from "./rules";
import { toFileView, type FileRecord, type FileView } from "./types";

export type UploadResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 404; errors: Record<string, string> };

const NOT_FOUND = { ok: false, status: 404, errors: { file: "파일을 찾을 수 없어요." } } as const;
const fail = (message: string) => ({ ok: false, status: 400, errors: { file: message } }) as const;
const done = <T>(value: T) => ({ ok: true, value }) as const;

function objectKey(workId: string | null, fileId: string): string {
  return workId ? `works/${workId}/${fileId}` : `profile/${fileId}`;
}

async function pendingFile(db: D1Database, id: string): Promise<(FileRecord & { uploadId: string }) | null> {
  const file = await files.getFile(db, id);
  return file && file.status === "uploading" && file.uploadId ? { ...file, uploadId: file.uploadId } : null;
}

function parseParts(raw: unknown): R2UploadedPart[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 10_000) return null;
  const parts: R2UploadedPart[] = [];
  for (const item of raw) {
    const { partNumber, etag } = (item ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(partNumber) || (partNumber as number) < 1 || typeof etag !== "string" || etag === "") return null;
    parts.push({ partNumber: partNumber as number, etag });
  }
  return parts.sort((a, b) => a.partNumber - b.partNumber);
}

export async function startUpload(
  db: D1Database,
  bucket: R2Bucket,
  raw: unknown,
  now: Date,
): Promise<UploadResult<{ fileId: string; partSize: number }>> {
  const check = validateUploadStart(raw);
  if (!check.ok) return { ok: false, status: 400, errors: check.errors };
  const start = check.value;
  if (start.workId !== null && !(await getWorkById(db, start.workId))) {
    return { ok: false, status: 404, errors: { file: "작품을 찾을 수 없어요." } };
  }
  const id = crypto.randomUUID();
  const key = objectKey(start.workId, id);
  const reserved = await files.reserveFile(
    db,
    {
      id,
      workId: start.workId,
      kind: start.kind,
      r2Key: key,
      thumbR2Key: null,
      originalName: start.fileName,
      relativePath: start.relativePath,
      contentType: start.contentType,
      sizeBytes: start.size,
      createdAt: now.toISOString(),
    },
    STORAGE_LIMIT_BYTES,
  );
  if (!reserved) return fail(storageFullMessage(await files.storageUsage(db)));
  try {
    const upload = await bucket.createMultipartUpload(key, { httpMetadata: { contentType: start.contentType } });
    await files.setUploadId(db, id, upload.uploadId);
  } catch (error) {
    await files.deleteFileRows(db, [id]);
    throw error;
  }
  return done({ fileId: id, partSize: PART_SIZE });
}

export async function uploadPart(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  partNumber: number,
  body: ArrayBuffer,
): Promise<UploadResult<R2UploadedPart>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) return fail("조각 번호가 올바르지 않아요.");
  if (body.byteLength > PART_SIZE) return fail("조각이 너무 커요.");
  const part = await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).uploadPart(partNumber, body);
  return done({ partNumber: part.partNumber, etag: part.etag });
}

export async function uploadThumb(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<UploadResult<null>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  const type = cleanContentType(contentType);
  if (!isImageKind(file.kind) || !(IMAGE_TYPES as readonly string[]).includes(type)) return fail("썸네일은 이미지에만 붙일 수 있어요.");
  if (body.byteLength > THUMB_MAX_BYTES) return fail("썸네일이 너무 커요.");
  const thumbKey = `${file.r2Key}.thumb`;
  await bucket.put(thumbKey, body, { httpMetadata: { contentType: type } });
  await files.setThumbKey(db, id, thumbKey);
  return done(null);
}

export async function removeFile(db: D1Database, bucket: R2Bucket, file: FileRecord): Promise<void> {
  if (file.status === "uploading" && file.uploadId) {
    try {
      await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).abort();
    } catch {
      // 이미 끝났거나 사라진 업로드
    }
  }
  await bucket.delete([file.r2Key, `${file.r2Key}.thumb`]);
  await files.deleteFileRows(db, [file.id]);
}

export async function completeUpload(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  rawParts: unknown,
): Promise<UploadResult<FileView>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  const parts = parseParts(rawParts);
  if (!parts) return fail("업로드 조각 정보가 올바르지 않아요.");
  const object = await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).complete(parts);
  let size = object.size;
  let thumbKey = file.thumbR2Key;
  if (thumbKey) size += (await bucket.head(thumbKey))?.size ?? 0;
  else if (isImageKind(file.kind)) thumbKey = file.r2Key;
  // 시작할 때 알린 크기로 용량을 예약했으므로, 실제로 더 크면 받지 않는다.
  if (object.size > MAX_FILE_BYTES || size > file.sizeBytes) {
    await removeFile(db, bucket, { ...file, status: "complete" });
    return fail(object.size > MAX_FILE_BYTES ? "파일이 너무 커요. 1GB까지 올릴 수 있어요." : "올린 파일이 처음 알린 크기보다 커요. 다시 시도해 주세요.");
  }
  await files.markComplete(db, id, size, thumbKey);
  if (file.kind === "cover" || file.kind === "avatar") {
    for (const old of await files.listOtherSingles(db, file)) await removeFile(db, bucket, old);
  }
  return done(toFileView((await files.getFile(db, id))!));
}

export async function abortUpload(db: D1Database, bucket: R2Bucket, id: string): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file || file.status !== "uploading") return NOT_FOUND;
  await removeFile(db, bucket, file);
  return done(null);
}

export async function deleteFile(db: D1Database, bucket: R2Bucket, id: string): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file) return NOT_FOUND;
  await removeFile(db, bucket, file);
  return done(null);
}

export async function deleteWorkWithFiles(db: D1Database, bucket: R2Bucket, workId: string): Promise<boolean> {
  for (const file of await files.listAllWorkFiles(db, workId)) await removeFile(db, bucket, file);
  return deleteWork(db, workId);
}

export async function cleanupStaleUploads(db: D1Database, bucket: R2Bucket, now: Date): Promise<number> {
  const before = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const stale = await files.listStaleUploads(db, before);
  for (const file of stale) await removeFile(db, bucket, file);
  return stale.length;
}

export async function moveGalleryFile(db: D1Database, id: string, direction: "up" | "down"): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file || file.kind !== "gallery" || file.status !== "complete" || !file.workId) return NOT_FOUND;
  const gallery = (await files.listWorkFiles(db, file.workId)).filter((item) => item.kind === "gallery");
  const index = gallery.findIndex((item) => item.id === id);
  const other = gallery[direction === "up" ? index - 1 : index + 1];
  if (other) await files.swapSortOrder(db, file, other);
  return done(null);
}
```

`test/files/uploads.test.ts`
```ts
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { getWorkById } from "../../src/lib/db/adminWorks";
import { getFile, listWorkFiles, storageUsage } from "../../src/lib/db/files";
import { PART_SIZE } from "../../src/lib/files/rules";
import {
  abortUpload,
  cleanupStaleUploads,
  completeUpload,
  deleteFile,
  deleteWorkWithFiles,
  moveGalleryFile,
  startUpload,
  uploadPart,
  uploadThumb,
} from "../../src/lib/files/uploads";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";
import { putCompleteFile, resetBucket } from "../helpers/files";

const NOW = new Date("2026-10-30T00:00:00.000Z");
const bytes = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;

async function uploadText(kind: "attachment" | "cover" | "gallery", text: string, extra: Record<string, unknown> = {}) {
  const size = bytes(text).byteLength;
  const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind, fileName: "a.txt", relativePath: "", contentType: "text/plain", size, ...extra }, NOW);
  if (!started.ok) throw new Error(JSON.stringify(started.errors));
  const part = await uploadPart(env.DB, env.FILES, started.value.fileId, 1, bytes(text));
  if (!part.ok) throw new Error("part");
  return { fileId: started.value.fileId, part: part.value };
}

beforeEach(async () => {
  await resetDb(env.DB);
  await resetBucket(env.FILES);
  await insertWorkRow(env.DB, makeWorkRow({ id: "w1", slug: "w1" }));
});

describe("업로드 흐름", () => {
  it("시작하면 uploading 기록과 조각 크기를 돌려주고, 선언한 크기를 사용량에 넣는다", async () => {
    const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "보고서.pdf", relativePath: "자료", contentType: "application/pdf", size: 1234 }, NOW);
    expect(started.ok && started.value.partSize).toBe(PART_SIZE);
    if (!started.ok) return;
    expect(await getFile(env.DB, started.value.fileId)).toMatchObject({ status: "uploading", relativePath: "자료", r2Key: `works/w1/${started.value.fileId}` });
    expect(await storageUsage(env.DB)).toBe(1234);
  });

  it("조각을 올리고 완료하면 complete가 되고 실제 크기를 남긴다", async () => {
    const { fileId, part } = await uploadText("attachment", "첨부 내용");
    const completed = await completeUpload(env.DB, env.FILES, fileId, [part]);
    expect(completed.ok && completed.value).toMatchObject({ id: fileId, kind: "attachment", url: `/files/${fileId}/a.txt`, thumbUrl: null });
    const file = await getFile(env.DB, fileId);
    expect(file).toMatchObject({ status: "complete", uploadId: null, sizeBytes: bytes("첨부 내용").byteLength });
    expect(await (await env.FILES.get(file!.r2Key))!.text()).toBe("첨부 내용");
  });

  it("10MiB 조각 두 개로 나눈 파일도 합친다", async () => {
    const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "big.bin", relativePath: "", contentType: "", size: PART_SIZE + 3 }, NOW);
    if (!started.ok) throw new Error("start");
    const first = await uploadPart(env.DB, env.FILES, started.value.fileId, 1, new Uint8Array(PART_SIZE).buffer);
    const second = await uploadPart(env.DB, env.FILES, started.value.fileId, 2, new Uint8Array(3).buffer);
    if (!first.ok || !second.ok) throw new Error("parts");
    const completed = await completeUpload(env.DB, env.FILES, started.value.fileId, [second.value, first.value]);
    expect(completed.ok && completed.value.sizeBytes).toBe(PART_SIZE + 3);
  });

  it("이미지는 썸네일 크기를 합쳐 세고, 썸네일이 없으면 원본을 썸네일로 쓴다", async () => {
    const withThumb = await uploadText("gallery", "원본", { contentType: "image/webp", size: bytes("원본").byteLength + bytes("썸").byteLength });
    expect((await uploadThumb(env.DB, env.FILES, withThumb.fileId, bytes("썸"), "image/webp")).ok).toBe(true);
    await completeUpload(env.DB, env.FILES, withThumb.fileId, [withThumb.part]);
    const thumbFile = await getFile(env.DB, withThumb.fileId);
    expect(thumbFile).toMatchObject({ thumbR2Key: `${thumbFile!.r2Key}.thumb`, sizeBytes: bytes("원본").byteLength + bytes("썸").byteLength });

    const gif = await uploadText("gallery", "움짤", { contentType: "image/gif" });
    await completeUpload(env.DB, env.FILES, gif.fileId, [gif.part]);
    const gifFile = await getFile(env.DB, gif.fileId);
    expect(gifFile!.thumbR2Key).toBe(gifFile!.r2Key);
  });

  it("전체 용량을 넘기거나 없는 작품이면 거절한다", async () => {
    await env.DB.prepare(
      "INSERT INTO files (id, work_id, kind, r2_key, original_name, content_type, size_bytes, status, created_at) VALUES ('big', 'w1', 'attachment', 'k', 'big', 'x/y', 9400000000, 'complete', 'now')",
    ).run();
    expect(await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "a", contentType: "", size: 200_000_000 }, NOW)).toEqual({
      ok: false,
      status: 400,
      errors: { file: "저장 공간이 부족해요. 10GB 중 9.40GB를 쓰고 있어요." },
    });
    expect(await startUpload(env.DB, env.FILES, { workId: "none", kind: "attachment", fileName: "a", contentType: "", size: 1 }, NOW)).toEqual({
      ok: false,
      status: 404,
      errors: { file: "작품을 찾을 수 없어요." },
    });
  });

  it("동시에 시작해도 전체 용량 상한을 넘지 않는다", async () => {
    await env.DB.prepare(
      "INSERT INTO files (id, work_id, kind, r2_key, original_name, content_type, size_bytes, status, created_at) VALUES ('big', 'w1', 'attachment', 'k', 'big', 'x/y', 9400000000, 'complete', 'now')",
    ).run();
    const request = { workId: "w1", kind: "attachment", fileName: "a", contentType: "", size: 100_000_000 };
    const results = await Promise.all([1, 2, 3].map(() => startUpload(env.DB, env.FILES, request, NOW)));
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(await storageUsage(env.DB)).toBe(9_500_000_000);
  });

  it("완료할 때 실제 크기가 알린 크기보다 크면 거절하고 지운다", async () => {
    const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "a", contentType: "", size: 1 }, NOW);
    if (!started.ok) throw new Error("start");
    const part = await uploadPart(env.DB, env.FILES, started.value.fileId, 1, bytes("다섯 글자"));
    if (!part.ok) throw new Error("part");
    expect(await completeUpload(env.DB, env.FILES, started.value.fileId, [part.value])).toEqual({
      ok: false,
      status: 400,
      errors: { file: "올린 파일이 처음 알린 크기보다 커요. 다시 시도해 주세요." },
    });
    expect(await getFile(env.DB, started.value.fileId)).toBeNull();
  });

  it("대표 이미지를 새로 올리면 이전 대표 이미지를 지운다", async () => {
    const old = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "cover", contentType: "image/png" });
    const next = await uploadText("cover", "새 표지", { contentType: "image/png" });
    await completeUpload(env.DB, env.FILES, next.fileId, [next.part]);
    expect(await getFile(env.DB, old.id)).toBeNull();
    expect(await env.FILES.head(old.r2Key)).toBeNull();
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([next.fileId]);
  });

  it("중단하면 기록이 사라지고, 끝난 업로드에는 조각을 더 올릴 수 없다", async () => {
    const { fileId } = await uploadText("attachment", "중단");
    expect(await abortUpload(env.DB, env.FILES, fileId)).toEqual({ ok: true, value: null });
    expect(await getFile(env.DB, fileId)).toBeNull();
    expect(await uploadPart(env.DB, env.FILES, fileId, 1, bytes("x"))).toEqual({
      ok: false,
      status: 404,
      errors: { file: "파일을 찾을 수 없어요." },
    });
  });
});

describe("파일 정리", () => {
  it("파일 하나를 지우면 R2 객체와 썸네일도 지운다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png", thumbBody: "썸" });
    expect(await deleteFile(env.DB, env.FILES, file.id)).toEqual({ ok: true, value: null });
    expect(await env.FILES.head(file.r2Key)).toBeNull();
    expect(await env.FILES.head(file.thumbR2Key!)).toBeNull();
  });

  it("작품을 지우면 그 작품의 파일과 R2 객체가 모두 사라진다", async () => {
    const a = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "attachment" });
    const b = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "cover", contentType: "image/png" });
    expect(await deleteWorkWithFiles(env.DB, env.FILES, "w1")).toBe(true);
    expect(await getWorkById(env.DB, "w1")).toBeNull();
    expect(await env.FILES.head(a.r2Key)).toBeNull();
    expect(await env.FILES.head(b.r2Key)).toBeNull();
    expect(await storageUsage(env.DB)).toBe(0);
  });

  it("24시간 넘게 uploading으로 남은 기록만 정리한다", async () => {
    const yesterday = new Date(NOW.getTime() - 25 * 60 * 60 * 1000);
    const stale = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "old", contentType: "", size: 1 }, yesterday);
    const fresh = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "new", contentType: "", size: 1 }, NOW);
    if (!stale.ok || !fresh.ok) throw new Error("start");
    expect(await cleanupStaleUploads(env.DB, env.FILES, NOW)).toBe(1);
    expect(await getFile(env.DB, stale.value.fileId)).toBeNull();
    expect(await getFile(env.DB, fresh.value.fileId)).not.toBeNull();
  });

  it("스크린샷 순서를 위아래로 바꾼다", async () => {
    const first = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png" });
    const second = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png" });
    await moveGalleryFile(env.DB, second.id, "up");
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([second.id, first.id]);
    await moveGalleryFile(env.DB, second.id, "up");
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([second.id, first.id]);
  });
});
```
