import { describe, expect, it } from "vitest";
import { stripHtml, summaryOf } from "../../src/lib/works/summary";

describe("stripHtml", () => {
  it("문단 사이는 띄우고 글자 안의 태그는 붙인다", () => {
    expect(stripHtml("<p>매일 할 일을 <strong>세 가지</strong>만</p><p>둘째</p>")).toBe("매일 할 일을 세 가지만 둘째");
  });

  it("script와 style 내용은 지우고 엔티티를 푼다", () => {
    expect(stripHtml("<style>p{}</style><p>A &amp; B &lt;C&gt;</p><script>alert(1)</script>")).toBe("A & B <C>");
  });
});

describe("summaryOf", () => {
  it("한 줄 요약이 있으면 그대로 쓴다", () => {
    expect(summaryOf({ summary: "  요약  ", descriptionHtml: "<p>설명</p>" })).toBe("요약");
  });

  it("없으면 설명의 앞 120자를 쓴다", () => {
    const text = "가".repeat(130);
    expect(summaryOf({ summary: null, descriptionHtml: `<p>${text}</p>` })).toBe("가".repeat(120));
  });

  it("이모지를 반으로 자르지 않는다", () => {
    const result = summaryOf({ summary: null, descriptionHtml: "😀".repeat(130) });
    expect(Array.from(result)).toHaveLength(120);
    expect(result).toBe("😀".repeat(120));
  });
});
