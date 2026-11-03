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
