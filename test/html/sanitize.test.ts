import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "../../src/lib/html/sanitize";

describe("sanitizeHtml", () => {
  it("허용한 서식은 그대로 둔다", async () => {
    const html = "<h2>제목</h2><p><strong>굵게</strong> <em>기울임</em> <u>밑줄</u> <s>취소</s></p><ul><li>하나</li></ul><ol><li>둘</li></ol><blockquote>인용</blockquote><pre><code>코드</code></pre><p>줄<br>바꿈</p><hr>";
    expect(await sanitizeHtml(html)).toBe(html);
  });

  it("script와 style은 내용까지 지운다", async () => {
    expect(await sanitizeHtml("<p>안녕</p><script>alert(1)</script><style>p{color:red}</style>")).toBe("<p>안녕</p>");
  });

  it("허용하지 않은 태그는 벗기고 글자는 남긴다", async () => {
    expect(await sanitizeHtml('<div><span>글자</span><img src="x.png"><h1>큰 제목</h1></div>')).toBe("글자큰 제목");
  });

  it("모든 속성을 지운다", async () => {
    expect(await sanitizeHtml('<p class="x" style="color:red" onclick="alert(1)">글</p>')).toBe("<p>글</p>");
  });

  it("링크는 http, https, mailto만 남기고 새 탭 속성을 붙인다", async () => {
    expect(await sanitizeHtml('<a href="https://example.com" title="t">사이트</a>')).toBe(
      '<a href="https://example.com" rel="noopener noreferrer" target="_blank">사이트</a>',
    );
    expect(await sanitizeHtml('<a href="mailto:a@b.c">메일</a>')).toBe(
      '<a href="mailto:a@b.c" rel="noopener noreferrer" target="_blank">메일</a>',
    );
    expect(await sanitizeHtml('<a href="javascript:alert(1)">위험</a>')).toBe("<a>위험</a>");
    expect(await sanitizeHtml('<a href="/works/x">상대</a>')).toBe("<a>상대</a>");
  });

  it("HTML 주석을 지운다", async () => {
    expect(await sanitizeHtml("<p>보임<!-- 숨김 --></p>")).toBe("<p>보임</p>");
  });
});
