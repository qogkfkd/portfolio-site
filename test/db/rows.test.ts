import { describe, expect, it } from "vitest";
import { rowToProfile, rowToWork } from "../../src/lib/db/rows";
import { makeWorkRow } from "../helpers/factories";

describe("rowToWork", () => {
  it("열 이름과 0/1 값을 작품 객체로 바꾼다", () => {
    const work = rowToWork(
      makeWorkRow({
        id: "a",
        slug: "한글-작품",
        title: "한글 작품",
        summary: "요약",
        fields_json: '["개발","디자인"]',
        techs_json: '["Astro"]',
        links_json: '[{"kind":"github","label":"코드","url":"https://github.com/x/y"}]',
        participated_on: "2025-08-23",
        team_type: "team",
        team_size: 4,
        is_public: 1,
        is_featured: 1,
      }),
    );
    expect(work).toMatchObject({
      id: "a",
      slug: "한글-작품",
      title: "한글 작품",
      summary: "요약",
      fields: ["개발", "디자인"],
      techs: ["Astro"],
      links: [{ kind: "github", label: "코드", url: "https://github.com/x/y" }],
      participatedOn: "2025-08-23",
      teamType: "team",
      teamSize: 4,
      isPublic: true,
      isFeatured: true,
    });
  });

  it("깨진 JSON은 빈 목록으로 바꾼다", () => {
    const work = rowToWork(makeWorkRow({ fields_json: "{oops", techs_json: '"text"', links_json: "null" }));
    expect(work.fields).toEqual([]);
    expect(work.techs).toEqual([]);
    expect(work.links).toEqual([]);
  });

  it("규칙에 맞지 않는 링크와 빈 태그를 버린다", () => {
    const work = rowToWork(
      makeWorkRow({
        fields_json: '["개발", "  ", 3]',
        links_json: JSON.stringify([
          { kind: "github", label: "ok", url: "https://example.com" },
          { kind: "unknown", label: "x", url: "https://example.com" },
          { kind: "demo", label: "x", url: "javascript:alert(1)" },
          { kind: "video", url: "https://youtu.be/aqz-KE-bpKQ" },
        ]),
      }),
    );
    expect(work.fields).toEqual(["개발"]);
    expect(work.links).toEqual([{ kind: "github", label: "ok", url: "https://example.com" }]);
  });

  it("빈 문자열은 null로, 개인 작품의 인원 수는 null로 둔다", () => {
    const work = rowToWork(
      makeWorkRow({ award: "  ", competition: "", team_type: "solo", team_size: 3, is_public: 0 }),
    );
    expect(work.award).toBeNull();
    expect(work.competition).toBeNull();
    expect(work.teamType).toBe("solo");
    expect(work.teamSize).toBeNull();
    expect(work.isPublic).toBe(false);
  });
});

describe("rowToProfile", () => {
  it("링크를 읽고 잘못된 주소와 빈 값을 버린다", () => {
    const profile = rowToProfile({
      id: 1,
      name: "홍길동",
      headline: "",
      bio: "소개",
      email: "a@b.c",
      github_url: "not a url",
      links_json: '[{"label":"블로그","url":"https://example.com"},{"label":"x","url":"ftp://x"},{"label":" ","url":"https://y.com"}]',
      updated_at: "2025-01-01T00:00:00.000Z",
    });
    expect(profile).toEqual({
      name: "홍길동",
      headline: null,
      bio: "소개",
      email: "a@b.c",
      githubUrl: null,
      links: [{ label: "블로그", url: "https://example.com" }],
      updatedAt: "2025-01-01T00:00:00.000Z",
    });
  });
});
