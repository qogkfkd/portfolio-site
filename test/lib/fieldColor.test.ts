import { describe, expect, it } from "vitest";
import { FIELD_PALETTE, fieldColor } from "../../src/lib/works/fieldColor";

describe("fieldColor", () => {
  it("6색 팔레트에서 분야 이름으로 정해진 색을 고른다", () => {
    expect(FIELD_PALETTE).toHaveLength(6);
    expect(fieldColor("개발")).toBe(FIELD_PALETTE[3]);
    expect(fieldColor("디자인")).toBe(FIELD_PALETTE[1]);
    expect(fieldColor("기획")).toBe(FIELD_PALETTE[4]);
    expect(fieldColor("데이터")).toBe(FIELD_PALETTE[5]);
  });

  it("같은 분야는 항상 같은 색이다", () => {
    expect(fieldColor("개발")).toBe(fieldColor("개발"));
  });

  it("분야가 없으면 첫 번째 색이다", () => {
    expect(fieldColor(undefined)).toBe(FIELD_PALETTE[0]);
    expect(fieldColor("")).toBe(FIELD_PALETTE[0]);
  });
});
