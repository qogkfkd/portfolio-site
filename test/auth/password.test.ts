import { describe, expect, it } from "vitest";
import { PBKDF2_ITERATIONS, hashPassword, verifyPassword } from "../../src/lib/auth/password";

describe("hashPassword", () => {
  it("pbkdf2:반복횟수:솔트:해시 형식으로 만든다", async () => {
    const stored = await hashPassword("correct horse");
    const [scheme, iterations, salt, hash] = stored.split(":");
    expect(scheme).toBe("pbkdf2");
    expect(Number(iterations)).toBe(PBKDF2_ITERATIONS);
    expect(PBKDF2_ITERATIONS).toBe(100_000);
    expect(salt).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("같은 비밀번호도 솔트가 다르면 결과가 다르다", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });
});

describe("verifyPassword", () => {
  it("맞는 비밀번호만 통과한다", async () => {
    const stored = await hashPassword("비밀번호123");
    expect(await verifyPassword("비밀번호123", stored)).toBe(true);
    expect(await verifyPassword("비밀번호124", stored)).toBe(false);
  });

  it("형식이 깨졌거나 비어 있으면 실패한다", async () => {
    expect(await verifyPassword("x", undefined)).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "sha1:1:abc:def")).toBe(false);
    expect(await verifyPassword("x", "pbkdf2:999999:AAAA:AAAA")).toBe(false);
    expect(await verifyPassword("x", "pbkdf2:100000:%%%:AAAA")).toBe(false);
  });
});
