import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("0001_init 마이그레이션", () => {
  it("기본 자기소개 한 줄을 만든다", async () => {
    const { results } = await env.DB.prepare("SELECT id, name, links_json FROM profile").all();
    expect(results).toEqual([{ id: 1, name: "이름을 입력하세요", links_json: "[]" }]);
  });

  it("작품, 파일, 로그인 잠금 테이블을 만든다", async () => {
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('works', 'files', 'login_attempts') ORDER BY name",
    ).all<{ name: string }>();
    expect(results.map((row) => row.name)).toEqual(["files", "login_attempts", "works"]);
  });

  it("자기소개는 id 1 한 줄만 허용한다", async () => {
    await expect(
      env.DB.prepare("INSERT INTO profile (id, name, updated_at) VALUES (2, 'x', 'now')").run(),
    ).rejects.toThrow();
  });
});
