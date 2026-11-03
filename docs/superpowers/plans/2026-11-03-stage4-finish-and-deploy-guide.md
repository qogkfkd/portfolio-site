# 4단계: 마무리와 배포 준비 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **이 프로젝트의 실행 방식:** 협업 규칙(`C:/Users/user/.codex-collab/RULES.md`)에 따라 Codex가 superpowers:executing-plans 방식으로 작업 1부터 2까지 순서대로 실행한다. 계획에 적힌 코드를 그대로 옮겨 적는다. 계획이 모호하거나 틀렸거나 같은 오류에 두 번 막히면 그 자리에서 멈추고 `collab/HANDOFF.md`에 적는다. 사용자는 2026-11-03에 "앞으로의 단계들은 쭉쭉 진행하면 돼"라고 이 단계의 진행을 미리 승인했다.

**Goal:** 브라우저 흐름 시험과 화면 확인을 자동으로 돌릴 수 있게 하고, 사용자가 혼자 따라 해서 배포할 수 있는 안내서를 만든다.

**Architecture:** Playwright가 배포용 빌드를 포트 4400에 띄워 설치된 Chrome으로 시험한다. 이미지는 시험 중에 캔버스로 만들어 저장소에 바이너리를 두지 않는다. 시험 데이터는 제목이 `E2E `로 시작하고, 시험 앞뒤로 지운다. 배포 안내서는 로그인과 배포를 사용자가 직접 한다는 전제로 쓴다.

**Tech Stack:** `@playwright/test` 1.64.1(`channel: "chrome"`), Astro 7, wrangler 4

**Spec:** `docs/superpowers/specs/2026-10-27-portfolio-site-design.md`의 6.2, 6.3, 7, 8, 10절

## 실행 계약

- **기준:** `main` 브랜치에서 이 계획 파일을 커밋한 지점. 그 앞의 `chore: add Playwright and deploy scripts` 커밋에서 Claude가 `package.json`, `package-lock.json`에 Playwright와 스크립트(`e2e`, `deploy`, `db:migrate:remote`)를 이미 넣고 설치했다.
- **Codex가 하지 않는 것(샌드박스 제약):**
  - 커밋(`.git` 쓰기 불가): 커밋은 리뷰 뒤 Claude가 작업별로 한다.
  - `npm run dev`, `npm run preview`, `npm run smoke`, `npm run e2e`: 서버 실행이 막혀 있어 Claude가 리뷰 때 샌드박스 밖에서 한다. Codex는 `npx playwright test --list`까지만 돌린다.
  - 저장소 밖 기본 경로에 쓸 수 없으면, 그 명령에서만 `npm_config_cache`와 `WRANGLER_LOG_PATH`를 임시 폴더로 지정한다.
- **잠금 파일:** `.codex-collab.lock`은 Claude가 이 Codex 실행을 위해 잡아 둔 잠금이다. 있는 것이 정상이고, 독점 상태라 읽을 수 없는 것도 정상이다. 다른 작성자는 없으니 잠금을 이유로 멈추지 말고, 읽거나 건드리지도 말고 진행한다.
- **완료 기준(Codex 실행분):**
  1. `npx playwright test --list`: `Total: 16 tests in 3 files`
  2. `npm test`: `Test Files  24 passed (24)`, `Tests  134 passed (134)`
  3. `npm run check`: `0 errors`, `0 warnings`, `0 hints`
  4. `npm run build`: `Complete!`
  5. `collab/HANDOFF.md` 작성
- **완료 기준(Claude 리뷰분):**
  1. `npm run smoke`: `smoke: 59 passed, 0 failed`
  2. `npm run e2e`: `16 passed`
  3. `e2e-screens/`의 1280px, 375px 사진을 눈으로 확인
  4. `npx wrangler deploy --dry-run`이 업로드 없이 끝나고 `env.DB`, `env.FILES`, `env.ASSETS`가 나온다
- **만들거나 바꿔도 되는 파일(이 목록 밖은 건드리지 않는다):**
  - 새로 만듦: `playwright.config.ts`, `e2e/cleanup.ts`, `e2e/global-setup.ts`, `e2e/helpers.ts`, `e2e/flows.spec.ts`, `e2e/files.spec.ts`, `e2e/layout.spec.ts`, `docs/배포-안내.md`
  - 바꿈(전체 교체): `.gitignore`, `scripts/hash-password.mjs`, `AGENTS.md`, `collab/HANDOFF.md`
- **하지 않는 것:** `src/`와 `test/`의 어떤 파일도 바꾸지 않는다. `wrangler.jsonc`를 바꾸지 않는다. `wrangler login`, `wrangler deploy`, `wrangler secret`, `--remote`, `git add`/`git commit`/`git push`, `npm install`, `npm approve-scripts`, `npx playwright install`은 실행하지 않는다. 시험이 맞도록 제품 코드를 고치지 않는다. 막히면 멈춘다.
- **이미 검증한 것:** 이 계획의 코드를 넣은 복제본에서 Claude가 `npm test` 134개, `npm run check`, `npm run build`, `smoke: 59 passed`, `16 passed`를 확인했다. 카드 수정(`017e560`)을 뺀 복제본에서는 카드 비율 시험이 0.4를 받아 실패하는 것도 확인했다.

## 알아 둘 위험

스펙이 직접 말하지 않았지만 사람이 쓰다 부딪히기 쉬운 경우다. 각 줄의 시험은 아래 작업에 들어 있다.

- **세로나 가로로 긴 대표 이미지:** 카드 비율을 지켜야 한다. `e2e/layout.spec.ts`의 카드 비율 시험.
- **10MiB가 넘는 첨부파일:** 조각 3개로 올라가고 내용이 바이트까지 같아야 한다. `e2e/files.spec.ts`의 큰 파일 시험.
- **올리다 끊긴 연결:** 오류를 보여주고 다시 시도로 끝낼 수 있어야 한다. `e2e/files.spec.ts`의 다시 시도 시험.
- **휴대폰 폭의 긴 첨부파일 이름:** 가로로 넘치면 안 된다. `e2e/layout.spec.ts`의 가로 넘침 시험.
- **한글 폴더와 파일 이름:** 폴더 구조와 내려받는 이름이 그대로여야 한다. `e2e/flows.spec.ts`의 3번, 5번 시험.

배포 뒤에만 알 수 있는 위험은 안내서에 적는다. 무료 요금제의 CPU 한도(요청당 10ms, 드문 초과는 허용)는 이 컴퓨터에서 재현되지 않는다. 로그인의 PBKDF2 10만 회와 10MiB 조각 업로드가 여기에 가장 가깝다. 안내서 8번 확인과 "막힐 때"의 `Error 1102` 항목이 이것을 다룬다.

---

### Task 1: 브라우저 흐름 시험과 화면 확인

**Files:**
- Create: `playwright.config.ts`, `e2e/cleanup.ts`, `e2e/global-setup.ts`, `e2e/helpers.ts`, `e2e/flows.spec.ts`, `e2e/files.spec.ts`, `e2e/layout.spec.ts`
- Modify(전체 교체): `.gitignore`

**Interfaces:**
- Consumes: `package.json`의 `e2e` 스크립트, 화면의 기존 식별자(`#cover-input`, `#gallery-input`, `#attachment-input`, `#folder-input`, `#avatar-input`, `.upload-row`, `li.work-row`, `article[data-list][data-work]`)
- Produces(`e2e/helpers.ts`): `PASSWORD`, `CreatedWork`, `login(page)`, `createWork(page, title)`, `pngFile(page, name, width, height, color?)`, `waitForUploads(page)`, `workRow(page, title)`, `publish(page, title)`, `loadImages(page)`, `brokenImages(page)`

- [ ] **Step 1: 설정 파일을 쓴다**

`playwright.config.ts`
```ts
import { defineConfig } from "@playwright/test";

const PORT = 4400;

// 배포용 빌드를 띄워 설치된 Chrome으로 시험한다. 브라우저를 따로 내려받지 않는다.
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/cleanup.ts",
  workers: 1,
  timeout: 90_000,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
```

`e2e/cleanup.ts`
```ts
import { execSync } from "node:child_process";

// 시험 데이터만 지운다. 로컬 DB만 건드린다.
const SQL = [
  "DELETE FROM files WHERE work_id IN (SELECT id FROM works WHERE title LIKE 'E2E %')",
  "DELETE FROM works WHERE title LIKE 'E2E %'",
  "DELETE FROM login_attempts",
].join("; ");

export default function cleanup(): void {
  execSync(`npx wrangler d1 execute DB --local --command "${SQL}"`, { stdio: "pipe" });
}
```

`e2e/global-setup.ts`
```ts
import { execSync } from "node:child_process";
import cleanup from "./cleanup";

export default function globalSetup(): void {
  execSync("npm run db:migrate:local", { stdio: "pipe" });
  execSync("npm run db:seed:local", { stdio: "pipe" });
  cleanup();
}
```

`.gitignore`
```gitignore
node_modules/
dist/
.astro/
.wrangler/
.dev.vars
worker-configuration.d.ts
test-results/
e2e-screens/
```

- [ ] **Step 2: 도우미를 쓴다**

`e2e/helpers.ts`
```ts
import { expect, type Locator, type Page } from "@playwright/test";

export const PASSWORD = "portfolio-dev-password";

export interface CreatedWork {
  id: string;
  slug: string;
  path: string;
}

export async function login(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.locator("input[name=password]").fill(PASSWORD);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

// 새 작품을 저장하고 수정 화면에 머문다.
export async function createWork(page: Page, title: string): Promise<CreatedWork> {
  await page.goto("/admin/works/new");
  await page.locator("#title").fill(title);
  await page.locator("#fields").fill("E2E분야");
  await page.locator("#fields").press("Enter");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("E2E 시험용 설명입니다.");
  await page.locator(".form-actions button[type=submit]").click();
  await expect(page).toHaveURL(/\/edit\?saved=1$/);
  const slug = await page.locator("#slug").inputValue();
  const id = new URL(page.url()).pathname.split("/")[3]!;
  return { id, slug, path: `/works/${encodeURIComponent(slug)}` };
}

// 브라우저 캔버스로 PNG를 만든다. 저장소에 이미지 파일을 두지 않는다.
export async function pngFile(page: Page, name: string, width: number, height: number, color = "#3354e0") {
  const dataUrl = await page.evaluate(
    ([w, h, fill]) => {
      const canvas = document.createElement("canvas");
      canvas.width = w as number;
      canvas.height = h as number;
      const context = canvas.getContext("2d")!;
      context.fillStyle = fill as string;
      context.fillRect(0, 0, w as number, h as number);
      return canvas.toDataURL("image/png");
    },
    [width, height, color] as const,
  );
  return { name, mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1]!, "base64") };
}

export async function waitForUploads(page: Page): Promise<void> {
  await expect(page.locator(".upload-row")).toHaveCount(0, { timeout: 60_000 });
}

export function workRow(page: Page, title: string): Locator {
  return page.locator("li.work-row").filter({ hasText: title });
}

export async function publish(page: Page, title: string): Promise<void> {
  await page.goto("/admin");
  await workRow(page, title).getByRole("button", { name: "공개하기" }).click();
  await expect(workRow(page, title).locator(".status-public")).toBeVisible();
}

// 지연 로딩 이미지를 바로 불러 깨진 이미지까지 잡아낸다.
export async function loadImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const images = Array.from(document.images).filter((image) => image.getAttribute("src"));
    await Promise.all(
      images.map((image) => {
        image.loading = "eager";
        return image.decode().catch(() => undefined);
      }),
    );
  });
}

export async function brokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => image.getAttribute("src") && image.naturalWidth === 0)
      .map((image) => image.src),
  );
}
```

- [ ] **Step 3: 스펙 6.2의 흐름 시험을 쓴다**

`e2e/flows.spec.ts`
```ts
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { PASSWORD, createWork, pngFile, publish, waitForUploads, workRow, type CreatedWork } from "./helpers";

// 스펙 6.2의 브라우저 흐름 1~7. 앞 시험의 결과를 뒤 시험이 이어 쓴다.
const TITLE = "E2E 전체 흐름";

test.describe.serial("관리자와 방문자 흐름", () => {
  let adminContext: BrowserContext;
  let visitorContext: BrowserContext;
  let admin: Page;
  let visitor: Page;
  let work: CreatedWork;
  let attachmentUrl: string;
  let imageUrl: string;

  test.beforeAll(async ({ browser }) => {
    adminContext = await browser.newContext();
    visitorContext = await browser.newContext();
    admin = await adminContext.newPage();
    visitor = await visitorContext.newPage();
  });

  test.afterAll(async () => {
    await adminContext.close();
    await visitorContext.close();
  });

  test("1. 틀린 비밀번호는 거절하고 맞는 비밀번호로 들어간다", async () => {
    await admin.goto("/admin");
    await expect(admin).toHaveURL(/\/admin\/login$/);
    await admin.locator("input[name=password]").fill("wrong-password");
    await admin.getByRole("button", { name: "로그인" }).click();
    await expect(admin.getByRole("alert")).toHaveText("비밀번호가 맞지 않아요.");
    await admin.locator("input[name=password]").fill(PASSWORD);
    await admin.getByRole("button", { name: "로그인" }).click();
    await expect(admin).toHaveURL(/\/admin$/);
  });

  test("2. 필수 항목 없이 저장하면 칸 옆에 오류가 나온다", async () => {
    await admin.goto("/admin/works/new");
    await expect(admin.locator(".ProseMirror")).toBeVisible();
    await expect(admin.getByText("저장하면 파일을 올릴 수 있어요")).toBeVisible();
    await admin.locator(".form-actions button[type=submit]").click();
    await expect(admin.getByText("작품명을 입력해 주세요.")).toBeVisible();
    await expect(admin.getByText("분야를 하나 이상 입력해 주세요.")).toBeVisible();
    await expect(admin.getByText("작품 설명을 입력해 주세요.")).toBeVisible();
    await expect(admin).toHaveURL(/\/admin\/works\/new$/);
  });

  test("3. 저장한 뒤 대표 이미지, 스크린샷, 첨부 폴더를 올린다", async () => {
    work = await createWork(admin, TITLE);

    await admin.locator("#cover-input").setInputFiles(await pngFile(admin, "표지.png", 2400, 1600));
    await expect(admin.locator(".single-image img")).toBeVisible();

    await admin
      .locator("#gallery-input")
      .setInputFiles([await pngFile(admin, "shot-a.png", 1600, 900, "#157a3c"), await pngFile(admin, "shot-b.png", 900, 1600, "#a4520a")]);
    await expect(admin.locator(".file-grid img")).toHaveCount(2);

    const root = mkdtempSync(path.join(tmpdir(), "portfolio-e2e-"));
    mkdirSync(path.join(root, "자료", "하위"), { recursive: true });
    writeFileSync(path.join(root, "자료", "설명.txt"), "설명 파일 내용");
    writeFileSync(path.join(root, "자료", "하위", "메모.txt"), "메모 파일 내용");
    await admin.locator("#folder-input").setInputFiles(path.join(root, "자료"));
    await expect(admin.locator(".attachment-list li")).toHaveCount(2);
    await expect(admin.locator(".attachment-folder")).toHaveText(["자료", "자료/하위"]);
    await waitForUploads(admin);

    // 이미지는 WebP로 줄어들고 썸네일은 긴 변 600px을 넘지 않는다.
    const thumbs = admin.locator(".file-grid img");
    await expect(thumbs.first()).toHaveAttribute("alt", /\.webp$/);
    await expect.poll(() => thumbs.first().evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    expect(await thumbs.first().evaluate((image: HTMLImageElement) => Math.max(image.naturalWidth, image.naturalHeight))).toBeLessThanOrEqual(600);

    attachmentUrl = (await admin.getByRole("link", { name: "설명.txt" }).getAttribute("href"))!;
    imageUrl = (await thumbs.first().getAttribute("src"))!;
  });

  test("4. 공개 전에는 방문자에게 목록, 상세, 파일이 보이지 않는다", async () => {
    await visitor.goto("/");
    await expect(visitor.locator(`article[data-work="${work.slug}"]`)).toHaveCount(0);
    expect((await visitor.goto(work.path))!.status()).toBe(404);
    expect((await visitorContext.request.get(attachmentUrl)).status()).toBe(404);
    expect((await visitorContext.request.get(imageUrl)).status()).toBe(404);

    await admin.goto(work.path);
    await expect(admin.getByText("비공개 미리보기")).toBeVisible();
  });

  test("5. 공개하면 방문자가 홈, 상세, 첨부 내려받기를 쓸 수 있다", async () => {
    await publish(admin, TITLE);

    await visitor.goto("/");
    await expect(visitor.locator(`article[data-list="all"][data-work="${work.slug}"] img`)).toBeVisible();

    await visitor.goto(work.path);
    await expect(visitor.locator(".cover-image")).toBeVisible();
    await expect(visitor.locator(".gallery img")).toHaveCount(2);
    await expect(visitor.getByText("비공개 미리보기")).toHaveCount(0);
    await expect(visitor.locator('meta[property="og:image"]')).toHaveAttribute("content", /^http:\/\/localhost:4400\/files\//);

    await visitor.locator(".gallery-item").first().click();
    await expect(visitor.locator("dialog[open] img")).toBeVisible();
    await visitor.locator(".lightbox-close").click();
    await expect(visitor.locator("dialog[open]")).toHaveCount(0);

    const [download] = await Promise.all([visitor.waitForEvent("download"), visitor.getByRole("link", { name: "설명.txt" }).click()]);
    expect(download.suggestedFilename()).toBe("설명.txt");
    expect(readFileSync(await download.path(), "utf8")).toBe("설명 파일 내용");
  });

  test("6. 분야, 연도, 수상 걸러 보기가 동작한다", async () => {
    const cards = visitor.locator('article[data-list="all"]');

    await visitor.goto("/");
    await visitor.locator("select[name=field]").selectOption("E2E분야");
    await visitor.getByRole("button", { name: "적용" }).click();
    await expect(visitor).toHaveURL(/field=/);
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText(TITLE);

    await visitor.goto("/");
    await visitor.locator("select[name=year]").selectOption("2024");
    await visitor.getByRole("button", { name: "적용" }).click();
    await expect(visitor).toHaveURL(/year=2024/);
    expect(await cards.count()).toBeGreaterThan(0);
    for (const card of await cards.all()) await expect(card).toContainText("2024년");

    await visitor.goto("/");
    await visitor.getByLabel("수상작만").check();
    await visitor.getByRole("button", { name: "적용" }).click();
    await expect(visitor).toHaveURL(/award=1/);
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(visitor.locator('article[data-list="all"] .badge-award')).toHaveCount(await cards.count());
  });

  test("7. 작품을 지우면 상세와 파일 주소가 404가 된다", async () => {
    await admin.goto("/admin");
    let message = "";
    admin.once("dialog", (dialog) => {
      message = dialog.message();
      void dialog.accept();
    });
    await workRow(admin, TITLE).getByRole("button", { name: "삭제" }).click();
    await expect(admin).toHaveURL(/deleted=1/);
    expect(message).toContain("함께 지워지는 파일 5개");

    expect((await visitor.goto(work.path))!.status()).toBe(404);
    expect((await visitorContext.request.get(attachmentUrl)).status()).toBe(404);
    expect((await visitorContext.request.get(imageUrl)).status()).toBe(404);
  });
});
```

- [ ] **Step 4: 파일 관리 시험을 쓴다**

`e2e/files.spec.ts`
```ts
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createWork, login, pngFile, waitForUploads } from "./helpers";

// 3단계의 파일 관리 동작을 실제 브라우저에서 눌러 본다.
const LARGE_FILE_BYTES = 25 * 1024 * 1024;

test.describe.serial("파일 관리", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page);
    await createWork(page, "E2E 파일 점검");
  });

  test.afterAll(async () => {
    await context.close();
  });

  const galleryNames = () => page.locator(".file-grid img").evaluateAll((images) => images.map((image) => image.getAttribute("alt")));

  test("대표 이미지를 바꾸면 이전 이미지는 지워진다", async () => {
    await page.locator("#cover-input").setInputFiles(await pngFile(page, "old.png", 800, 600));
    const image = page.locator(".single-image img");
    await expect(image).toBeVisible();
    await waitForUploads(page);
    const oldUrl = (await image.getAttribute("src"))!;

    await page.locator("#cover-input").setInputFiles(await pngFile(page, "new.png", 800, 600, "#a4520a"));
    await expect(image).not.toHaveAttribute("src", oldUrl);
    await waitForUploads(page);
    expect((await context.request.get(oldUrl)).status()).toBe(404);
  });

  test("스크린샷 순서를 바꾸고 하나를 지운다", async () => {
    await page.locator("#gallery-input").setInputFiles(await pngFile(page, "first.png", 800, 600));
    await expect(page.locator(".file-grid img")).toHaveCount(1);
    await waitForUploads(page);
    await page.locator("#gallery-input").setInputFiles(await pngFile(page, "second.png", 800, 600, "#157a3c"));
    await expect(page.locator(".file-grid img")).toHaveCount(2);
    await waitForUploads(page);
    expect(await galleryNames()).toEqual(["first.webp", "second.webp"]);

    await page.locator(".file-grid li").first().getByRole("button", { name: "뒤로" }).click();
    await expect.poll(galleryNames).toEqual(["second.webp", "first.webp"]);
    await page.reload();
    await expect.poll(galleryNames).toEqual(["second.webp", "first.webp"]);

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "second.webp 지우기" }).click();
    await expect.poll(galleryNames).toEqual(["first.webp"]);
    await page.reload();
    await expect.poll(galleryNames).toEqual(["first.webp"]);
  });

  test("10MiB보다 큰 파일은 조각으로 올라가고 내용이 그대로다", async () => {
    const content = randomBytes(LARGE_FILE_BYTES);
    const filePath = path.join(mkdtempSync(path.join(tmpdir(), "portfolio-e2e-")), "큰파일.bin");
    writeFileSync(filePath, content);
    let parts = 0;
    page.on("request", (request) => {
      if (request.method() === "PUT" && /\/parts\/\d+$/.test(request.url())) parts += 1;
    });

    await page.locator("#attachment-input").setInputFiles(filePath);
    const link = page.getByRole("link", { name: "큰파일.bin" });
    await expect(link).toBeVisible({ timeout: 60_000 });
    await waitForUploads(page);
    expect(parts).toBe(3);

    const response = await context.request.get((await link.getAttribute("href"))!);
    expect(response.status()).toBe(200);
    const body = await response.body();
    expect(body.length).toBe(LARGE_FILE_BYTES);
    expect(createHash("sha256").update(body).digest("hex")).toBe(createHash("sha256").update(content).digest("hex"));
    await expect(page.locator(".file-head [data-usage]")).not.toContainText("0.00GB");
  });

  test("올리다 끊기면 오류를 보여주고 다시 시도로 끝낼 수 있다", async () => {
    await page.route("**/api/admin/uploads/*/parts/*", (route) => route.abort(), { times: 1 });
    await page.locator("#attachment-input").setInputFiles({ name: "끊김.txt", mimeType: "text/plain", buffer: Buffer.from("다시 시도 내용") });

    const row = page.locator(".upload-row.upload-error");
    await expect(row).toContainText("끊겼어요");
    await row.getByRole("button", { name: "다시 시도" }).click();
    await expect(page.getByRole("link", { name: "끊김.txt" })).toBeVisible();
    await waitForUploads(page);
  });

  test("프로필 사진을 올리면 로그인 없이 홈에 보이고, 지우면 사라진다", async ({ browser }) => {
    await page.goto("/admin/profile");
    await page.locator("#avatar-input").setInputFiles(await pngFile(page, "프로필.png", 600, 600));
    await expect(page.locator(".single-image img")).toBeVisible();
    await waitForUploads(page);

    const visitorContext = await browser.newContext();
    const visitor = await visitorContext.newPage();
    await visitor.goto("/");
    await expect.poll(() => visitor.locator(".hero img.avatar").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);

    page.once("dialog", (dialog) => void dialog.accept());
    await page.locator(".single-image").getByRole("button", { name: "지우기" }).click();
    await expect(page.locator(".single-image img")).toHaveCount(0);
    await visitor.goto("/");
    await expect(visitor.locator(".hero img.avatar")).toHaveCount(0);
    await visitorContext.close();
  });
});
```

- [ ] **Step 5: 화면 폭별 시험을 쓴다**

`e2e/layout.spec.ts`
```ts
import path from "node:path";
import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { brokenImages, createWork, loadImages, login, pngFile, publish, waitForUploads, workRow, type CreatedWork } from "./helpers";

// 스펙 6.3: 375px와 1280px에서 화면이 깨지지 않는지 본다. 사람이 볼 수 있게 e2e-screens에 찍어 둔다.
const WIDTHS = [1280, 375];
const SCREENS = path.resolve("e2e-screens");

async function coverRatio(page: Page, cover: Locator): Promise<number> {
  await cover.scrollIntoViewIfNeeded();
  await loadImages(page);
  const box = (await cover.boundingBox())!;
  return box.width / box.height;
}

test.describe.serial("화면 폭별 확인", () => {
  let context: BrowserContext;
  let page: Page;
  let tall: CreatedWork;
  let wide: CreatedWork;
  let tallEditPath: string;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page);

    tall = await createWork(page, "E2E 세로 표지");
    tallEditPath = new URL(page.url()).pathname;
    await page.locator("#cover-input").setInputFiles(await pngFile(page, "tall.png", 800, 2000));
    await expect(page.locator(".single-image img")).toBeVisible();
    await page.locator("#gallery-input").setInputFiles(await pngFile(page, "shot.png", 1600, 900, "#157a3c"));
    await page.locator("#attachment-input").setInputFiles({ name: "아주-긴-이름의-첨부파일-모바일에서-넘치지-않아야-한다-0123456789.txt", mimeType: "text/plain", buffer: Buffer.from("내용") });
    await expect(page.locator(".attachment-list li")).toHaveCount(1);
    await waitForUploads(page);

    wide = await createWork(page, "E2E 가로 표지");
    await page.locator("#cover-input").setInputFiles(await pngFile(page, "wide.png", 2000, 400, "#a4520a"));
    await expect(page.locator(".single-image img")).toBeVisible();
    await waitForUploads(page);

    await publish(page, "E2E 세로 표지");
    await publish(page, "E2E 가로 표지");
    await workRow(page, "E2E 세로 표지").getByRole("button", { name: "대표작으로" }).click();
    await expect(workRow(page, "E2E 세로 표지").locator(".status-featured")).toBeVisible();
  });

  test.afterAll(async () => {
    await context.close();
  });

  for (const width of WIDTHS) {
    test(`대표 이미지가 세로나 가로로 길어도 카드 비율을 지킨다 (${width}px)`, async () => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      expect(await coverRatio(page, page.locator(`article[data-list="all"][data-work="${tall.slug}"] .cover`))).toBeCloseTo(16 / 10, 1);
      expect(await coverRatio(page, page.locator(`article[data-list="all"][data-work="${wide.slug}"] .cover`))).toBeCloseTo(16 / 10, 1);
      expect(await coverRatio(page, page.locator(`article[data-list="featured"][data-work="${tall.slug}"] .cover`))).toBeCloseTo(16 / 9, 1);
    });

    test(`가로로 넘치거나 깨진 이미지가 없다 (${width}px)`, async () => {
      await page.setViewportSize({ width, height: 900 });
      const pages: [string, string][] = [
        ["home", "/"],
        ["detail", tall.path],
        ["admin-list", "/admin"],
        ["admin-new", "/admin/works/new"],
        ["admin-edit", tallEditPath],
        ["admin-profile", "/admin/profile"],
      ];
      for (const [name, url] of pages) {
        await page.goto(url);
        await page.waitForLoadState("networkidle");
        await loadImages(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${name} 가로 넘침`).toBeLessThanOrEqual(0);
        expect(await brokenImages(page), `${name} 깨진 이미지`).toEqual([]);
        await page.screenshot({ path: path.join(SCREENS, `${name}-${width}.png`), fullPage: true });
      }
    });
  }
});
```

- [ ] **Step 6: 시험이 모두 잡히는지 확인한다**

서버를 띄우지 않고 목록만 본다.

```powershell
npx playwright test --list
```

기대 결과: 마지막 줄이 `Total: 16 tests in 3 files`

- [ ] **Step 7: 기존 검증이 그대로인지 확인한다**

```powershell
npm test
npm run check
```

기대 결과: `Test Files  24 passed (24)`, `Tests  134 passed (134)`, `0 errors`, `0 warnings`, `0 hints`. `e2e/`는 Vitest와 타입 검사 범위 밖이다. 자동 테스트의 `.text()` 경고 3건은 이전부터 있던 것이라 그대로 둔다.

- [ ] **Step 8: 완료 기록**

커밋하지 않는다. `collab/HANDOFF.md`에 적을 내용을 기억해 둔다. `npm run e2e`는 Claude가 돌린다.

### Task 2: 배포 안내서, 비밀번호 도구, 프로젝트 지침

**Files:**
- Create: `docs/배포-안내.md`
- Modify(전체 교체): `scripts/hash-password.mjs`, `AGENTS.md`, `collab/HANDOFF.md`

**Interfaces:**
- Consumes: `package.json`의 `deploy`, `db:migrate:remote`, `hash-password` 스크립트
- Produces: `npm run hash-password`는 인자가 없으면 비밀번호를 물어본다. 인자로 받는 기존 방식도 그대로 쓸 수 있다. 8자 미만이면 종료 코드 1이다.

- [ ] **Step 1: 비밀번호 도구를 바꾼다**

명령 기록에 비밀번호가 남지 않도록 물어보는 방식을 더한다.

`scripts/hash-password.mjs`
```js
// 사용법: npm run hash-password (물어보는 칸에 비밀번호를 넣는다. 명령 기록에 비밀번호가 남지 않는다.)
// 결과를 .dev.vars 또는 `wrangler secret put ADMIN_PASSWORD_HASH`에 넣는다.
import { createInterface } from "node:readline/promises";
import { hashPassword } from "../src/lib/auth/password.ts";

let password = process.argv[2];
if (!password) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  password = await prompt.question("새 비밀번호(8자 이상): ");
  prompt.close();
}
if (!password || password.length < 8) {
  console.error("8자 이상의 비밀번호를 넣어 주세요.");
  process.exit(1);
}
console.log(await hashPassword(password));
```

- [ ] **Step 2: 도구를 확인한다**

```powershell
"portfolio-dev-password" | node scripts/hash-password.mjs
node scripts/hash-password.mjs "portfolio-dev-password"
"short" | node scripts/hash-password.mjs; "EXIT=" + $LASTEXITCODE
```

기대 결과: 앞의 두 명령은 출력에 `pbkdf2:100000:`이 들어 있다. 파이프로 넣으면 입력 줄바꿈이 화면에 없어서 물음 문구와 같은 줄에 나오는데 정상이다. 세 번째는 `8자 이상의 비밀번호를 넣어 주세요.`와 `EXIT=1`이다.

- [ ] **Step 3: 배포 안내서를 쓴다**

`docs/배포-안내.md`
````markdown
# 사이트를 인터넷에 올리는 방법

처음 한 번만 1번부터 8번까지 순서대로 하면 됩니다. 30분쯤 걸립니다. 로그인과 배포는 계정 주인이 직접 해야 해서 Claude와 Codex는 대신 하지 않습니다.

명령은 모두 PowerShell에 한 줄씩 붙여 넣습니다. 먼저 프로젝트 폴더로 들어갑니다.

```powershell
cd "C:\Private Portfolio Website"
```

## 시작 전에 알아 둘 것

- **주소:** `https://portfolio.내이름.workers.dev` 형태입니다. `내이름`은 6번에서 정합니다.
- **비용:** 아래 무료 범위 안에서는 돈이 들지 않습니다.
  - 저장 공간(R2): 10GB. 사이트가 9.5GB에서 업로드를 막습니다.
  - 파일 요청(R2): 쓰기 월 100만 번, 읽기 월 1,000만 번. 내려받는 데이터 양에는 요금이 없습니다.
  - 사이트 요청(Workers): 하루 10만 번. 넘으면 다음 날까지 방문자에게 오류가 보이고 요금은 나오지 않습니다.
- **카드 등록:** R2를 켤 때 카드 등록을 요구할 수 있습니다. 등록했다면, R2 무료 범위를 넘을 때 요금이 나올 수 있습니다(저장 1GB당 월 0.015달러). 개인 포트폴리오로는 넘기 어려운 양입니다.

## 1. Cloudflare에 가입한다

<https://dash.cloudflare.com/sign-up> 에서 가입하고, 이메일로 온 인증 링크를 누릅니다.

## 2. 이 컴퓨터에서 로그인한다

```powershell
npx wrangler login
```

브라우저가 열리면 **Allow**를 누릅니다. 아래 명령에 내 계정 이메일이 나오면 됩니다.

```powershell
npx wrangler whoami
```

## 3. R2를 켠다

[Cloudflare 대시보드](https://dash.cloudflare.com/)의 왼쪽 메뉴에서 **R2**를 찾아 화면의 안내대로 켭니다. 메뉴 이름과 위치는 바뀔 수 있습니다.

## 4. 파일 저장소를 만든다

```powershell
npx wrangler r2 bucket create portfolio-files
```

## 5. 데이터베이스를 만든다

```powershell
npx wrangler d1 create portfolio --location apac
```

설정 파일에 추가할지 물으면 **No**를 고릅니다. 출력에 나오는 `database_id` 값을 복사합니다.

[wrangler.jsonc](../wrangler.jsonc)를 메모장으로 열어 `database_name` 다음 줄에 `database_id`를 넣고 저장합니다. 따옴표와 쉼표까지 똑같이 씁니다.

```jsonc
      "binding": "DB",
      "database_name": "portfolio",
      "database_id": "여기에-복사한-값",
      "migrations_dir": "migrations"
```

표를 만듭니다. 계속할지 물으면 `y`를 누릅니다.

```powershell
npm run db:migrate:remote
```

`0001_init.sql` 옆에 ✅가 나오면 됩니다.

## 6. 사이트를 올린다

```powershell
npm run deploy
```

`workers.dev` 하위 도메인을 처음 정하는 경우 물어보면 `y`를 누르고, 주소에 쓸 이름을 넣습니다. 끝나면 `https://portfolio.내이름.workers.dev` 주소가 나옵니다. 이 주소를 적어 둡니다.

## 7. 관리자 비밀번호를 정한다

관리자 비밀번호를 해시(원문을 알 수 없게 바꾼 값)로 만듭니다.

```powershell
npm run hash-password
```

비밀번호를 넣습니다. 12자 이상의 영문, 숫자, `-` 조합을 권합니다. 입력한 글자는 화면에 보이지만 어디에도 저장되지 않습니다. `pbkdf2:100000:`으로 시작하는 결과 한 줄을 복사해 다음 명령의 입력 칸에 붙여 넣습니다. 붙여 넣어도 칸에는 아무것도 보이지 않는 것이 정상입니다. 그대로 Enter를 누릅니다.

```powershell
npx wrangler secret put ADMIN_PASSWORD_HASH
```

로그인 쿠키에 서명할 값을 만듭니다.

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

나온 값을 복사해 다음 명령의 입력 칸에 같은 방법으로 넣습니다.

```powershell
npx wrangler secret put SESSION_SECRET
```

이 두 값과 비밀번호는 코드나 문서에 적지 않습니다. 개발용 비밀번호 `portfolio-dev-password`는 올린 사이트에서는 쓰이지 않습니다.

## 8. 잘 올라갔는지 확인한다

1. `주소/admin/login`에서 7번의 비밀번호로 로그인합니다.
2. **자기소개**에서 이름을 내 이름으로 바꾸고, 프로필 사진을 올립니다.
3. **새 작품**을 만들어 저장한 뒤, 대표 이미지, 스크린샷, 첨부파일을 올립니다. 첨부파일 하나는 10MB가 넘는 것으로 해 봅니다.
4. 저장 공간 사용량이 늘었는지 봅니다.
5. 브라우저의 시크릿 창에서 작품 상세 주소를 열면 "찾을 수 없다"는 화면이 나와야 합니다. 아직 비공개이기 때문입니다.
6. 작품 목록에서 **공개하기**를 누른 뒤, 시크릿 창에서 홈, 작품 상세, 첨부 내려받기를 확인합니다.
7. 시험용 작품을 지웁니다.

여기까지 되면 끝입니다. 이제 실제 작품을 올리고 주소를 공유하면 됩니다.

## 평소에 쓰는 법

- **내용 고치기:** `주소/admin`에서 합니다. 다시 배포할 필요가 없습니다.
- **코드를 고친 뒤:** `npm run deploy`를 실행합니다. `migrations` 폴더에 새 파일이 생겼다면 그전에 `npm run db:migrate:remote`를 먼저 실행합니다.
- **비밀번호 바꾸기:** 7번의 `hash-password`와 `ADMIN_PASSWORD_HASH`를 다시 합니다.
- **모든 기기에서 로그아웃시키기:** 7번의 `SESSION_SECRET`을 새 값으로 다시 넣습니다.

## 백업

- **글과 작품 정보(D1):** 무료 요금제에서는 7일 안의 시점으로 되돌릴 수 있습니다. 되돌리면 지금 내용을 덮어쓰므로, 필요할 때는 먼저 Claude에게 물어보는 것이 안전합니다.

  ```powershell
  npx wrangler d1 time-travel restore portfolio --timestamp=2026-11-03T12:00:00+09:00
  ```

- **이미지와 첨부파일(R2):** 되돌리는 기능이 없습니다. 지우면 사라지니 원본은 컴퓨터에 보관합니다.

## 막힐 때

| 보이는 것 | 뜻 | 할 일 |
|---|---|---|
| `You are not authenticated` | 로그인이 안 됐거나 풀렸습니다. | 2번을 다시 합니다. |
| R2를 켜라는 오류(`code: 10042`) | R2가 꺼져 있습니다. | 3번을 합니다. |
| `database_id` 관련 오류 | [wrangler.jsonc](../wrangler.jsonc)에 값이 없거나 틀렸습니다. | 5번을 확인합니다. |
| 로그인할 때 "관리자 비밀번호가 아직 설정되지 않았어요." | 비밀값이 없습니다. | 7번을 합니다. |
| 로그인할 때 "로그인을 너무 많이 시도했어요." | 5번 틀려서 잠겼습니다. | 15분 뒤에 다시 합니다. |
| 화면에 `no such table` 또는 오류 화면 | 표가 안 만들어졌을 수 있습니다. | 5번의 `npm run db:migrate:remote`를 다시 합니다. |
| `Error 1102` | 요청 하나가 무료 CPU 한도(10ms)를 자주 넘었습니다. 가끔은 괜찮습니다. | 어떤 화면에서 났는지 Claude에게 알려 줍니다. |
| `Error 1027` | 오늘 요청 10만 번을 다 썼습니다. | 한국 시간 오전 9시에 풀립니다. |
| 그 밖의 오류 | | `npx wrangler tail`을 켠 채로 다시 해 보고, 나온 내용을 Claude에게 보여 줍니다. |

`wrangler.jsonc`에 `database_id`를 넣으면 이 컴퓨터의 시험용 DB도 새것이 됩니다. 이 컴퓨터에서 사이트를 다시 시험할 때는 `npm run db:migrate:local`과 `npm run db:seed:local`을 먼저 실행합니다.

## 나중에 개인 도메인을 쓰고 싶다면

코드는 바꾸지 않아도 됩니다. Cloudflare 대시보드의 Worker 설정에서 도메인을 연결합니다. 필요해지면 Claude에게 물어보세요.
````

- [ ] **Step 4: 프로젝트 지침을 바꾼다**

`AGENTS.md`
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
| 관리자 비밀번호 해시 만들기 | `npm run hash-password` (물어보는 칸에 비밀번호를 넣는다) |
| 로컬 DB 마이그레이션 | `npm run db:migrate:local` |
| 로컬 예시 데이터 넣기 | `npm run db:seed:local` |
| 개발 서버 | `npm run dev` |
| 단위·DB 테스트 | `npm test` |
| 타입 검사 | `npm run check` |
| 빌드 | `npm run build` |
| 화면 점검 | `npm run smoke` (마이그레이션, 예시 데이터, `.dev.vars`를 먼저 준비한다) |
| 브라우저 흐름 시험 | `npm run e2e` (`.dev.vars`를 먼저 준비한다. 설치된 Chrome을 쓰고, 화면 사진을 `e2e-screens/`에 남긴다) |
| 배포 | `npm run deploy` (사용자가 직접 한다. 순서는 `docs/배포-안내.md`) |
| 원격 DB 마이그레이션 | `npm run db:migrate:remote` (사용자가 직접 한다) |

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
- 브라우저 시험은 `e2e/`에 있고 배포용 빌드를 포트 4400에 띄워 돈다. 시험 데이터는 제목을 `E2E `로 시작하고, 시험 앞뒤로 `e2e/cleanup.ts`가 지운다.
- Codex 샌드박스에서는 `.git` 쓰기와 개발 서버 실행이 막혀 있다. 커밋, `npm run dev`, `npm run smoke`, `npm run e2e`는 Claude가 리뷰 때 샌드박스 밖에서 한다.
- 배포(`wrangler deploy`, `npm run deploy`), 로그인(`wrangler login`), `--remote` 명령, `git push`는 Claude와 Codex가 하지 않는다. 사용자가 `docs/배포-안내.md`를 따라 직접 한다.
```

- [ ] **Step 5: 최종 검증을 한다**

```powershell
npx playwright test --list
npm test
npm run check
npm run build
git diff --check
```

기대 결과: 실행 계약의 완료 기준과 같다. `git diff --check`의 LF→CRLF 안내는 무시한다.

- [ ] **Step 6: 인계를 쓴다**

`collab/HANDOFF.md`를 처음부터 다시 쓴다. 실행한 계획, 작업별 완료 상태, 수정 파일과 새 파일, 명령별 종료 코드와 결과, 계획과 다른 점, 미실행 항목(`npm run smoke`, `npm run e2e`, 배포)을 짧게 적는다. 커밋은 하지 않는다.

## Claude 리뷰 순서(샌드박스 밖)

1. `HANDOFF.md`와 실제 변경을 확인한다. 검증한 복제본과 줄바꿈만 맞춰 대조한다.
2. `npm test`, `npm run check`, `npm run build`를 다시 실행한다.
3. `npm run db:migrate:local`, `npm run db:seed:local`, `npm run smoke`를 실행한다. 기대 결과는 `smoke: 59 passed, 0 failed`.
4. `npm run e2e`를 실행한다. 기대 결과는 `16 passed`.
5. `e2e-screens/`의 사진을 눈으로 본다.
6. `npx wrangler deploy --dry-run`을 실행한다. 올리지 않고 끝나는지 본다.
7. 안내서를 처음 보는 사람 입장에서 다시 읽는다.
8. 문제가 없으면 작업별로 커밋한다.

| 작업 | 커밋 메시지 | 파일 |
|---|---|---|
| 1 | `test: add browser flow tests with Playwright` | `playwright.config.ts`, `e2e/`, `.gitignore` |
| 2 | `docs: add deployment guide and finish stage 4` | `docs/배포-안내.md`, `scripts/hash-password.mjs`, `AGENTS.md`, `collab/HANDOFF.md` |
