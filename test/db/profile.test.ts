import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PROFILE_NAME, getProfile, updateProfile } from "../../src/lib/db/profile";
import { resetDb } from "../helpers/db";

beforeEach(async () => {
  await resetDb(env.DB);
});

describe("getProfile", () => {
  it("처음에는 기본 이름을 돌려준다", async () => {
    const profile = await getProfile(env.DB);
    expect(profile.name).toBe(DEFAULT_PROFILE_NAME);
    expect(profile.links).toEqual([]);
  });

  it("저장된 자기소개와 링크를 읽는다", async () => {
    await env.DB.prepare(
      "UPDATE profile SET name = ?, headline = ?, links_json = ? WHERE id = 1",
    )
      .bind("홍길동", "개발자", '[{"label":"블로그","url":"https://example.com"}]')
      .run();
    const profile = await getProfile(env.DB);
    expect(profile).toMatchObject({
      name: "홍길동",
      headline: "개발자",
      links: [{ label: "블로그", url: "https://example.com" }],
    });
  });
});

describe("updateProfile", () => {
  it("자기소개를 바꾸고 링크를 JSON으로 저장한다", async () => {
    const profile = await updateProfile(
      env.DB,
      { name: "김작가", headline: null, bio: "소개", email: "me@example.com", githubUrl: null, links: [{ label: "블로그", url: "https://b.com" }] },
      new Date("2026-10-29T00:00:00.000Z"),
    );
    expect(profile).toEqual({
      name: "김작가",
      headline: null,
      bio: "소개",
      email: "me@example.com",
      githubUrl: null,
      links: [{ label: "블로그", url: "https://b.com" }],
      updatedAt: "2026-10-29T00:00:00.000Z",
    });
  });
});
