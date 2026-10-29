import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { getPublicWorkBySlug, listPublicWorks } from "../../src/lib/db/works";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";

beforeEach(async () => {
  await resetDb(env.DB);
});

describe("listPublicWorks", () => {
  it("공개 작품만 정렬 날짜 최신순으로 돌려준다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ slug: "old", participated_on: "2024-01-01" }));
    await insertWorkRow(env.DB, makeWorkRow({ slug: "hidden", participated_on: "2026-01-01", is_public: 0 }));
    await insertWorkRow(env.DB, makeWorkRow({ slug: "new", participated_on: "2025-05-05" }));
    const works = await listPublicWorks(env.DB);
    expect(works.map((work) => work.slug)).toEqual(["new", "old"]);
  });

  it("공개 작품이 없으면 빈 목록", async () => {
    expect(await listPublicWorks(env.DB)).toEqual([]);
  });
});

describe("getPublicWorkBySlug", () => {
  it("한글 slug로 공개 작품을 찾는다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ slug: "한글-작품", title: "한글 작품" }));
    const work = await getPublicWorkBySlug(env.DB, "한글-작품");
    expect(work?.title).toBe("한글 작품");
  });

  it("비공개이거나 없는 slug면 null", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ slug: "secret", is_public: 0 }));
    expect(await getPublicWorkBySlug(env.DB, "secret")).toBeNull();
    expect(await getPublicWorkBySlug(env.DB, "none")).toBeNull();
  });
});
