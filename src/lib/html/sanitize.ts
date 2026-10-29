// 작품 설명 HTML을 허용 목록 방식으로 정리한다(스펙 5.3). Workers에 내장된 HTMLRewriter를 쓴다.
const ALLOWED_TAGS = new Set(["p", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li", "a", "blockquote", "code", "pre", "br", "hr"]);
const DROP_WITH_CONTENT = new Set(["script", "style"]);
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function isSafeHref(href: string): boolean {
  try {
    return SAFE_PROTOCOLS.has(new URL(href.trim()).protocol);
  } catch {
    return false;
  }
}

export async function sanitizeHtml(html: string): Promise<string> {
  const rewriter = new HTMLRewriter()
    .on("*", {
      element(element) {
        const tag = element.tagName.toLowerCase();
        if (DROP_WITH_CONTENT.has(tag)) {
          element.remove();
          return;
        }
        if (!ALLOWED_TAGS.has(tag)) {
          element.removeAndKeepContent();
          return;
        }
        // DOM 타입과 Workers 타입의 Element가 겹쳐서, Workers의 실제 모양([이름, 값] 반복자)으로 지정한다.
        const names = Array.from(element.attributes as unknown as Iterable<[string, string]>, ([name]) => name);
        for (const name of names) {
          if (!(tag === "a" && name === "href")) element.removeAttribute(name);
        }
        if (tag === "a") {
          const href = element.getAttribute("href");
          if (href !== null && isSafeHref(href)) {
            element.setAttribute("rel", "noopener noreferrer");
            element.setAttribute("target", "_blank");
          } else {
            element.removeAttribute("href");
          }
        }
      },
    })
    .onDocument({
      comments(comment) {
        comment.remove();
      },
    });
  return rewriter.transform(new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })).text();
}
