import { describe, expect, it } from "vitest";
import { parseRange } from "../../src/lib/files/range";

describe("parseRange", () => {
  it("범위가 없거나 여러 개면 전체를 보낸다", () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("bytes=0-1,5-6", 100)).toBeNull();
  });

  it("시작-끝, 시작-, 마지막 n바이트를 해석한다", () => {
    expect(parseRange("bytes=0-9", 100)).toEqual({ offset: 0, length: 10 });
    expect(parseRange("bytes=90-", 100)).toEqual({ offset: 90, length: 10 });
    expect(parseRange("bytes=-5", 100)).toEqual({ offset: 95, length: 5 });
    expect(parseRange("bytes=95-500", 100)).toEqual({ offset: 95, length: 5 });
    expect(parseRange("bytes=-500", 100)).toEqual({ offset: 0, length: 100 });
  });

  it("만족할 수 없는 범위는 invalid", () => {
    expect(parseRange("bytes=100-", 100)).toBe("invalid");
    expect(parseRange("bytes=9-3", 100)).toBe("invalid");
    expect(parseRange("bytes=-", 100)).toBe("invalid");
    expect(parseRange("bytes=-0", 100)).toBe("invalid");
    expect(parseRange("items=0-1", 100)).toBe("invalid");
  });
});
