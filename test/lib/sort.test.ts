import { describe, expect, it } from "vitest";
import { sortDateOf, sortFeatured, sortWorks, yearOf } from "../../src/lib/works/sort";
import { makeWork } from "../helpers/factories";

describe("sortDateOf", () => {
  it("참가일을 먼저 쓴다", () => {
    expect(sortDateOf(makeWork({ participatedOn: "2025-08-23", periodStart: "2025-07-01" }))).toBe("2025-08-23");
  });

  it("참가일이 없으면 작업 시작일을 쓴다", () => {
    expect(sortDateOf(makeWork({ periodStart: "2025-07-01" }))).toBe("2025-07-01");
  });

  it("둘 다 없으면 등록일의 날짜 부분을 쓴다", () => {
    expect(sortDateOf(makeWork({ createdAt: "2023-05-01T09:00:00.000Z" }))).toBe("2023-05-01");
  });
});

describe("yearOf", () => {
  it("정렬 날짜의 연도를 돌려준다", () => {
    expect(yearOf(makeWork({ periodStart: "2024-09-01" }))).toBe(2024);
  });
});

describe("sortFeatured", () => {
  it("수상작을 먼저, 그 안에서는 정렬 날짜 최신순", () => {
    const newest = makeWork({ slug: "newest", participatedOn: "2026-10-01" });
    const award = makeWork({ slug: "award", participatedOn: "2026-04-01", award: "금상" });
    const oldAward = makeWork({ slug: "old-award", participatedOn: "2025-04-01", award: "은상" });
    const blank = makeWork({ slug: "blank", participatedOn: "2026-01-01", award: "  " });
    expect(sortFeatured([oldAward, blank, newest, award]).map((work) => work.slug)).toEqual(["award", "old-award", "newest", "blank"]);
  });
});

describe("sortWorks", () => {
  it("정렬 날짜 최신순, 같으면 등록일 최신순", () => {
    const a = makeWork({ slug: "a", participatedOn: "2024-01-01" });
    const b = makeWork({ slug: "b", participatedOn: "2025-01-01", createdAt: "2025-01-02T00:00:00.000Z" });
    const c = makeWork({ slug: "c", participatedOn: "2025-01-01", createdAt: "2025-03-01T00:00:00.000Z" });
    expect(sortWorks([a, b, c]).map((work) => work.slug)).toEqual(["c", "b", "a"]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const works = [makeWork({ slug: "a", participatedOn: "2024-01-01" }), makeWork({ slug: "b", participatedOn: "2025-01-01" })];
    sortWorks(works);
    expect(works.map((work) => work.slug)).toEqual(["a", "b"]);
  });
});
