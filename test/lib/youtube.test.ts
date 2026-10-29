import { describe, expect, it } from "vitest";
import { youtubeEmbedUrl } from "../../src/lib/works/youtube";

const EMBED = "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ";

describe("youtubeEmbedUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtube.com/watch?v=aqz-KE-bpKQ&t=42s",
    "https://m.youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtu.be/aqz-KE-bpKQ?si=abc",
    "https://www.youtube.com/shorts/aqz-KE-bpKQ",
  ])("%s 는 퍼가기 주소가 된다", (url) => {
    expect(youtubeEmbedUrl(url)).toBe(EMBED);
  });

  it.each([
    "https://vimeo.com/123",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/channel/abc",
    "javascript:alert(1)",
    "유튜브",
  ])("%s 는 null", (url) => {
    expect(youtubeEmbedUrl(url)).toBeNull();
  });
});
