export interface ByteRange {
  offset: number;
  length: number;
}

// "bytes=시작-끝" 하나만 지원한다. 범위가 없거나 여러 개면 null(전체 전송), 만족할 수 없으면 "invalid"(416).
export function parseRange(header: string | null, size: number): ByteRange | null | "invalid" {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return header.includes(",") ? null : "invalid";
  const [, startText = "", endText = ""] = match;
  if (startText === "" && endText === "") return "invalid";
  if (startText === "") {
    const suffix = Number(endText);
    if (suffix === 0 || size === 0) return "invalid";
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }
  const start = Number(startText);
  if (start >= size) return "invalid";
  const end = endText === "" ? size - 1 : Math.min(Number(endText), size - 1);
  if (end < start) return "invalid";
  return { offset: start, length: end - start + 1 };
}
