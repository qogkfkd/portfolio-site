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
  devMethod: "ai",
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
