import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createWork, login, publish, waitForUploads, workRow, type CreatedWork } from "./helpers";

// 개발 방식 구분과 첨부파일 바로 보기.
const HAND = "E2E 직접 코딩";
const AI = "E2E AI 협업";

async function editWork(page: Page, work: CreatedWork, values: { method: "hand" | "ai"; award?: string; date: string }) {
  await page.goto(`/admin/works/${work.id}/edit`);
  await page.locator(`input[name=devMethod][value=${values.method}]`).check();
  await page.locator("#participatedOn").fill(values.date);
  if (values.award) await page.locator("#award").fill(values.award);
  await page.locator(".form-actions button[type=submit]").click();
  await expect(page.locator(".alert-success")).toHaveText("저장했어요.");
}

test.describe.serial("개발 방식과 파일 보기", () => {
  let adminContext: BrowserContext;
  let visitorContext: BrowserContext;
  let admin: Page;
  let visitor: Page;
  let hand: CreatedWork;
  let ai: CreatedWork;

  test.beforeAll(async ({ browser }) => {
    adminContext = await browser.newContext();
    visitorContext = await browser.newContext();
    admin = await adminContext.newPage();
    visitor = await visitorContext.newPage();
    await login(admin);
    hand = await createWork(admin, HAND, "E2E분류");
    await editWork(admin, hand, { method: "hand", award: "금상", date: "2026-04-01" });
    await admin.locator("#attachment-input").setInputFiles([
      { name: "대회 안내.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") },
      { name: "개최 계획.hwp", mimeType: "application/x-hwp", buffer: Buffer.from("hwp") },
    ]);
    await expect(admin.locator(".attachment-list li")).toHaveCount(2);
    await waitForUploads(admin);
    ai = await createWork(admin, AI, "E2E분류");
    await editWork(admin, ai, { method: "ai", date: "2026-10-01" });
    for (const title of [HAND, AI]) {
      await publish(admin, title);
      await workRow(admin, title).getByRole("button", { name: "대표작으로" }).click();
      await expect(workRow(admin, title).locator(".status-featured")).toBeVisible();
    }
  });

  test.afterAll(async () => {
    await adminContext.close();
    await visitorContext.close();
  });

  test("수정 화면을 다시 열어도 개발 방식이 남아 있다", async () => {
    await admin.goto(`/admin/works/${hand.id}/edit`);
    await expect(admin.locator("input[name=devMethod][value=hand]")).toBeChecked();
    await admin.goto("/admin");
    await expect(workRow(admin, HAND)).toContainText("직접 코딩");
  });

  test("카드와 상세에 배지가 보이고, 대표작은 수상작이 먼저다", async () => {
    await visitor.goto("/");
    const handCard = visitor.locator(`article[data-list="all"][data-work="${hand.slug}"]`);
    await expect(handCard.locator(".badge-method-hand")).toHaveText("직접 코딩");
    await expect(visitor.locator(`article[data-list="all"][data-work="${ai.slug}"] .badge-method-ai`)).toHaveText("AI 협업");

    const featured = await visitor.locator('article[data-list="featured"]').evaluateAll((els) => els.map((el) => el.getAttribute("data-work")));
    expect(featured.indexOf(hand.slug)).toBeLessThan(featured.indexOf(ai.slug));

    await visitor.goto(hand.path);
    await expect(visitor.locator(".head .badge-method-hand")).toHaveText("직접 코딩");
  });

  test("개발 방식으로 걸러 본다", async () => {
    await visitor.goto("/");
    await visitor.locator("select[name=method]").selectOption("hand");
    await expect(visitor).toHaveURL(/method=hand/);
    const cards = visitor.locator('article[data-list="all"]');
    await expect(cards.filter({ hasText: HAND })).toHaveCount(1);
    await expect(cards.filter({ hasText: AI })).toHaveCount(0);
    await expect(visitor.locator("select[name=method]")).toHaveValue("hand");
    for (const card of await cards.all()) await expect(card.locator(".badge-method-hand")).toBeVisible();
  });

  test("PDF는 보기와 내려받기가 되고, hwp는 내려받기만 된다", async () => {
    await visitor.goto(hand.path);
    const view = visitor.getByRole("link", { name: "대회 안내.pdf 보기" });
    await expect(view).toHaveAttribute("href", /\?v=view$/);
    await expect(view).toHaveAttribute("target", "_blank");
    await expect(visitor.getByRole("link", { name: "개최 계획.hwp 보기" })).toHaveCount(0);

    const shown = await visitorContext.request.get((await view.getAttribute("href"))!);
    expect(shown.status()).toBe(200);
    expect(shown.headers()["content-disposition"]).toMatch(/^inline;/);
    expect(shown.headers()["content-type"]).toBe("application/pdf");

    const [download] = await Promise.all([visitor.waitForEvent("download"), visitor.getByRole("link", { name: "개최 계획.hwp", exact: true }).click()]);
    expect(download.suggestedFilename()).toBe("개최 계획.hwp");
  });
});
