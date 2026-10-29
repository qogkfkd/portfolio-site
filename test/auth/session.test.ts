import { describe, expect, it } from "vitest";
import { SESSION_MAX_AGE_SECONDS, createSessionToken, verifySessionToken } from "../../src/lib/auth/session";

const SECRET = "test-session-secret";
const NOW = Date.UTC(2026, 9, 29, 0, 0, 0);

describe("session token", () => {
  it("만료 시각과 서명으로 이루어지고 7일 동안 유효하다", async () => {
    const token = await createSessionToken(SECRET, NOW);
    const [expires, signature] = token.split(".");
    expect(SESSION_MAX_AGE_SECONDS).toBe(604800);
    expect(Number(expires)).toBe(NOW + 604800 * 1000);
    expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await verifySessionToken(SECRET, token, NOW + 1000)).toBe(true);
  });

  it("만료되면 거부한다", async () => {
    const token = await createSessionToken(SECRET, NOW);
    expect(await verifySessionToken(SECRET, token, NOW + 604800 * 1000)).toBe(false);
  });

  it("다른 비밀값이나 바뀐 만료 시각은 거부한다", async () => {
    const token = await createSessionToken(SECRET, NOW);
    const [, signature] = token.split(".");
    expect(await verifySessionToken("other-secret", token, NOW)).toBe(false);
    expect(await verifySessionToken(SECRET, `${NOW + 999999999}.${signature}`, NOW)).toBe(false);
  });

  it("형식이 이상하거나 값이 없으면 거부한다", async () => {
    expect(await verifySessionToken(SECRET, undefined, NOW)).toBe(false);
    expect(await verifySessionToken(undefined, "1.abc", NOW)).toBe(false);
    expect(await verifySessionToken(SECRET, "abc", NOW)).toBe(false);
    expect(await verifySessionToken(SECRET, "9999999999999.%%%", NOW)).toBe(false);
    expect(await verifySessionToken(SECRET, "9999999999999.a.b", NOW)).toBe(false);
  });
});
