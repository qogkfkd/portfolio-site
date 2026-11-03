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
