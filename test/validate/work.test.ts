import { describe, expect, it } from "vitest";
import { EMPTY_WORK_INPUT, validateWorkInput, workToInput, type WorkInput } from "../../src/lib/validate/work";
import { makeWork } from "../helpers/factories";

const valid: WorkInput = {
  ...EMPTY_WORK_INPUT,
  title: "  캠퍼스 분실물 지도 ",
  descriptionHtml: "<p>설명</p>",
  fields: ["개발", " 개발 ", "기획", ""],
};

function errorsOf(input: Partial<WorkInput> | unknown): Record<string, string> {
  const result = validateWorkInput(typeof input === "object" && input !== null ? { ...valid, ...input } : input);
  return result.ok ? {} : result.errors;
}

describe("validateWorkInput", () => {
  it("필수 항목만 있어도 통과하고 값을 정리한다", () => {
    const result = validateWorkInput(valid);
    expect(result).toEqual({
      ok: true,
      value: {
        title: "캠퍼스 분실물 지도",
        slug: null,
        summary: null,
        descriptionHtml: "<p>설명</p>",
        fields: ["개발", "기획"],
        techs: [],
        links: [],
        competition: null,
        organizer: null,
        participatedOn: null,
        periodStart: null,
        periodEnd: null,
        award: null,
        teamType: null,
        teamSize: null,
        role: null,
      },
    });
  });

  it("필수 항목(작품명, 분야, 설명)이 없으면 한국어 오류를 준다", () => {
    expect(errorsOf({ title: " ", fields: [], descriptionHtml: "<p> </p>" })).toEqual({
      title: "작품명을 입력해 주세요.",
      fields: "분야를 하나 이상 입력해 주세요.",
      descriptionHtml: "작품 설명을 입력해 주세요.",
    });
    expect(errorsOf(null)).toMatchObject({ title: "작품명을 입력해 주세요." });
  });

  it("글자 수 제한을 지킨다", () => {
    expect(errorsOf({ title: "가".repeat(101) })).toEqual({ title: "작품명은 100자까지 쓸 수 있어요." });
    expect(errorsOf({ summary: "가".repeat(121) })).toEqual({ summary: "한 줄 요약은 120자까지 쓸 수 있어요." });
    expect(errorsOf({ fields: ["가".repeat(31)] })).toEqual({ fields: "분야 이름은 30자까지 쓸 수 있어요." });
  });

  it("날짜 형식과 기간 순서를 검사한다", () => {
    expect(errorsOf({ participatedOn: "2025-02-30" })).toEqual({ participatedOn: "날짜 형식이 올바르지 않아요." });
    expect(errorsOf({ periodStart: "2025-03-01", periodEnd: "2025-02-01" })).toEqual({ periodEnd: "종료일이 시작일보다 빨라요." });
    expect(validateWorkInput({ ...valid, periodStart: "2025-03-01", periodEnd: "2025-03-01" }).ok).toBe(true);
  });

  it("팀이면 인원 수를 2 이상 숫자로 받고, 개인이면 인원 수를 버린다", () => {
    expect(errorsOf({ teamType: "team", teamSize: "1" })).toEqual({ teamSize: "팀 인원은 2명 이상의 숫자로 입력해 주세요." });
    const team = validateWorkInput({ ...valid, teamType: "team", teamSize: "4" });
    expect(team.ok && team.value.teamSize).toBe(4);
    const solo = validateWorkInput({ ...valid, teamType: "solo", teamSize: "4" });
    expect(solo.ok && [solo.value.teamType, solo.value.teamSize]).toEqual(["solo", null]);
  });

  it("링크는 종류와 http(s) 주소를 검사하고 빈 줄은 건너뛴다", () => {
    expect(
      errorsOf({
        links: [
          { kind: "github", label: "코드", url: "https://github.com/x" },
          { kind: "github", label: "", url: "" },
          { kind: "demo", label: "데모", url: "javascript:alert(1)" },
          { kind: "unknown", label: "x", url: "https://x.com" },
        ],
      }),
    ).toEqual({ "links.2": "주소는 http:// 또는 https://로 시작해야 해요.", "links.3": "링크 종류를 골라 주세요." });
    const ok = validateWorkInput({ ...valid, links: [{ kind: "video", label: " ", url: "https://youtu.be/aqz-KE-bpKQ" }] });
    expect(ok.ok && ok.value.links).toEqual([{ kind: "video", label: "", url: "https://youtu.be/aqz-KE-bpKQ" }]);
  });

  it("주소(slug)는 소문자로 바꾸고 형식을 검사한다", () => {
    const ok = validateWorkInput({ ...valid, slug: " Brand-Identity " });
    expect(ok.ok && ok.value.slug).toBe("brand-identity");
    expect(errorsOf({ slug: "a/b" })).toEqual({ slug: "주소에는 소문자, 한글, 숫자와 하이픈(-)만 쓸 수 있어요." });
  });
});

describe("workToInput", () => {
  it("작품을 폼 값으로 바꾼다", () => {
    const input = workToInput(makeWork({ title: "제목", teamType: "team", teamSize: 3, award: null }));
    expect(input).toMatchObject({ title: "제목", teamType: "team", teamSize: "3", award: "" });
  });
});
