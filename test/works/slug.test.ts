import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { isValidSlug, slugify, uniqueSlug } from "../../src/lib/works/slug";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";

describe("slugify", () => {
  it("한글을 그대로 두고 띄어쓰기를 하이픈으로 바꾼다", () => {
    expect(slugify("캠퍼스 분실물 지도")).toBe("캠퍼스-분실물-지도");
  });

  it("특수문자를 지우고 영문은 소문자로 만든다", () => {
    expect(slugify("  Hello, World! (2025) ")).toBe("hello-world-2025");
    expect(slugify("A_B -- C")).toBe("a-b-c");
  });

  it("남는 글자가 없으면 work", () => {
    expect(slugify("!!!")).toBe("work");
  });

  it("60자까지만 쓴다", () => {
    expect(Array.from(slugify("가".repeat(80)))).toHaveLength(60);
  });
});

describe("isValidSlug", () => {
  it("소문자, 한글, 숫자와 하이픈만 허용한다", () => {
    expect(isValidSlug("캠퍼스-분실물-지도")).toBe(true);
    expect(isValidSlug("brand-identity-2")).toBe(true);
    expect(isValidSlug("Brand")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("-a")).toBe(false);
    expect(isValidSlug("a/b")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  it("겹치면 -2, -3을 붙인다", async () => {
    expect(await uniqueSlug(env.DB, "작품")).toBe("작품");
    await insertWorkRow(env.DB, makeWorkRow({ id: "a", slug: "작품" }));
    expect(await uniqueSlug(env.DB, "작품")).toBe("작품-2");
    await insertWorkRow(env.DB, makeWorkRow({ id: "b", slug: "작품-2" }));
    expect(await uniqueSlug(env.DB, "작품")).toBe("작품-3");
  });

  it("자기 자신은 겹친 것으로 보지 않는다", async () => {
    await insertWorkRow(env.DB, makeWorkRow({ id: "a", slug: "작품" }));
    expect(await uniqueSlug(env.DB, "작품", "a")).toBe("작품");
  });
});
