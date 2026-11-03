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
