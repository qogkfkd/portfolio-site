import { describe, expect, it } from "vitest";
import { clientIp, isAdminPath, isSameOrigin } from "../../src/lib/auth/request";

const post = (headers: Record<string, string>) =>
  new Request("https://portfolio.example.workers.dev/api/admin/works", { method: "POST", headers });

describe("isSameOrigin", () => {
  it("Origin이 사이트 자신일 때만 true", () => {
    expect(isSameOrigin(post({ Origin: "https://portfolio.example.workers.dev" }))).toBe(true);
    expect(isSameOrigin(post({ Origin: "https://evil.example.com" }))).toBe(false);
    expect(isSameOrigin(post({}))).toBe(false);
  });
});

describe("clientIp", () => {
  it("CF-Connecting-IP를 쓰고, 없으면 local", () => {
    expect(clientIp(post({ "CF-Connecting-IP": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(post({}))).toBe("local");
  });
});

describe("isAdminPath", () => {
  it("관리자 화면과 관리자 API만 해당한다", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/login")).toBe(true);
    expect(isAdminPath("/api/admin/works")).toBe(true);
    expect(isAdminPath("/administrator")).toBe(false);
    expect(isAdminPath("/works/admin")).toBe(false);
  });
});
