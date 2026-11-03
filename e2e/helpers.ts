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
export async function createWork(page: Page, title: string, field = "E2E분야"): Promise<CreatedWork> {
  await page.goto("/admin/works/new");
  await page.locator("#title").fill(title);
  await page.locator("#fields").fill(field);
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
