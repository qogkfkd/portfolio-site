import { describe, expect, it } from "vitest";
import { validateProfileInput } from "../../src/lib/validate/profile";

const valid = { name: " 홍길동 ", headline: "", bio: "", email: "", githubUrl: "", links: [] };

describe("validateProfileInput", () => {
  it("이름만 있어도 통과하고 빈 값은 null로 둔다", () => {
    expect(validateProfileInput(valid)).toEqual({
      ok: true,
      value: { name: "홍길동", headline: null, bio: null, email: null, githubUrl: null, links: [] },
    });
  });

  it("이름이 없거나 형식이 틀리면 오류를 준다", () => {
    const result = validateProfileInput({
      ...valid,
      name: "",
      email: "not-an-email",
      githubUrl: "github.com/me",
      links: [{ label: "", url: "https://x.com" }, { label: "블로그", url: "ftp://x" }, { label: "", url: "" }],
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "이름을 입력해 주세요.",
        email: "이메일 형식이 올바르지 않아요.",
        githubUrl: "주소는 http:// 또는 https://로 시작해야 해요.",
        "links.0": "링크 이름을 입력해 주세요.",
        "links.1": "주소는 http:// 또는 https://로 시작해야 해요.",
      },
    });
  });

  it("자기소개 글은 줄바꿈을 지키고 1000자까지 받는다", () => {
    const ok = validateProfileInput({ ...valid, bio: "첫 줄\n둘째 줄" });
    expect(ok.ok && ok.value.bio).toBe("첫 줄\n둘째 줄");
    expect(validateProfileInput({ ...valid, bio: "가".repeat(1001) })).toEqual({
      ok: false,
      errors: { bio: "자기소개는 1000자까지 쓸 수 있어요." },
    });
  });
});
