import { describe, expect, it } from "vitest";
import type { Work } from "../../src/lib/types";
import {
  applyFilters,
  emptyStateMessage,
  filterOptions,
  hasActiveFilters,
  parseFilters,
} from "../../src/lib/works/filter";
import { makeWork } from "../helpers/factories";

const NO_FILTERS = { field: null, year: null, award: false, method: null };
const slugs = (works: Work[]) => works.map((work) => work.slug);

describe("parseFilters", () => {
  it("한글 분야, 연도, 수상 조건을 읽는다", () => {
    expect(parseFilters(new URLSearchParams("field=%EB%94%94%EC%9E%90%EC%9D%B8&year=2025&award=1"))).toEqual({
      field: "디자인",
      year: 2025,
      award: true,
      method: null,
    });
  });

  it("개발 방식을 읽고 잘못된 값은 무시한다", () => {
    expect(parseFilters(new URLSearchParams("method=hand")).method).toBe("hand");
    expect(parseFilters(new URLSearchParams("method=ai")).method).toBe("ai");
    expect(parseFilters(new URLSearchParams("method=vibe")).method).toBeNull();
  });

  it("잘못된 값은 무시한다", () => {
    expect(parseFilters(new URLSearchParams("field=%20%20&year=abcd&award=true"))).toEqual(NO_FILTERS);
    expect(parseFilters(new URLSearchParams("year=20255")).year).toBeNull();
    expect(parseFilters(new URLSearchParams(""))).toEqual(NO_FILTERS);
  });
});

describe("applyFilters", () => {
  const dev = makeWork({ slug: "dev", fields: ["개발"], participatedOn: "2025-03-01", award: "대상", devMethod: "hand" });
  const design = makeWork({ slug: "design", fields: ["디자인", "기획"], participatedOn: "2024-05-01", devMethod: "ai" });
  const both = makeWork({ slug: "both", fields: ["개발", "기획"], periodStart: "2024-10-01", award: "  " });
  const all = [dev, design, both];

  it("조건이 없으면 그대로 돌려준다", () => {
    expect(slugs(applyFilters(all, NO_FILTERS))).toEqual(["dev", "design", "both"]);
  });

  it("분야로 거른다", () => {
    expect(slugs(applyFilters(all, { ...NO_FILTERS, field: "기획" }))).toEqual(["design", "both"]);
  });

  it("연도로 거른다", () => {
    expect(slugs(applyFilters(all, { ...NO_FILTERS, year: 2024 }))).toEqual(["design", "both"]);
  });

  it("수상작만 남긴다 (공백뿐인 수상은 제외)", () => {
    expect(slugs(applyFilters(all, { ...NO_FILTERS, award: true }))).toEqual(["dev"]);
  });

  it("개발 방식으로 거르고, 값이 없는 작품은 빠진다", () => {
    expect(slugs(applyFilters(all, { ...NO_FILTERS, method: "hand" }))).toEqual(["dev"]);
    expect(slugs(applyFilters(all, { ...NO_FILTERS, method: "ai" }))).toEqual(["design"]);
  });

  it("조건을 함께 적용한다", () => {
    expect(slugs(applyFilters(all, { ...NO_FILTERS, field: "개발", year: 2024 }))).toEqual(["both"]);
  });

  it("선택지는 분야 가나다순, 연도 최신순으로 중복 없이 만든다", () => {
    expect(filterOptions(all)).toEqual({ fields: ["개발", "기획", "디자인"], years: [2025, 2024], methods: ["hand", "ai"] });
  });

  it("개발 방식 선택지는 실제로 있는 값만 만든다", () => {
    expect(filterOptions([both]).methods).toEqual([]);
    expect(filterOptions([design, both]).methods).toEqual(["ai"]);
  });
});

describe("hasActiveFilters", () => {
  it("하나라도 있으면 true", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, award: true })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, method: "ai" })).toBe(true);
  });
});

describe("emptyStateMessage", () => {
  it("공개 작품이 없을 때와 조건 때문에 비었을 때를 구분한다", () => {
    expect(emptyStateMessage(0, { ...NO_FILTERS, field: "개발" })).toBe("아직 공개된 작품이 없어요.");
    expect(emptyStateMessage(3, { ...NO_FILTERS, field: "개발" })).toBe("조건에 맞는 작품이 없어요.");
  });
});
