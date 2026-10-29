import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { clearFailures, getLockStatus, recordFailure } from "../../src/lib/auth/lockout";
import { resetDb } from "../helpers/db";

const IP = "203.0.113.7";
const NOW = new Date("2026-10-29T00:00:00.000Z");
const later = (minutes: number) => new Date(NOW.getTime() + minutes * 60 * 1000);

beforeEach(async () => {
  await resetDb(env.DB);
});

describe("로그인 잠금", () => {
  it("4번 틀려도 잠기지 않고 5번째에 15분 잠긴다", async () => {
    for (let i = 0; i < 4; i += 1) {
      expect((await recordFailure(env.DB, IP, NOW)).locked).toBe(false);
    }
    const fifth = await recordFailure(env.DB, IP, NOW);
    expect(fifth).toEqual({ locked: true, lockedUntil: "2026-10-29T00:15:00.000Z" });
    expect((await getLockStatus(env.DB, IP, later(14))).locked).toBe(true);
  });

  it("15분이 지나면 풀리고, 다시 틀리면 처음부터 센다", async () => {
    for (let i = 0; i < 5; i += 1) await recordFailure(env.DB, IP, NOW);
    expect(await getLockStatus(env.DB, IP, later(15))).toEqual({ locked: false, lockedUntil: null });
    for (let i = 0; i < 4; i += 1) {
      expect((await recordFailure(env.DB, IP, later(16))).locked).toBe(false);
    }
  });

  it("성공하면 실패 횟수를 지운다", async () => {
    for (let i = 0; i < 4; i += 1) await recordFailure(env.DB, IP, NOW);
    await clearFailures(env.DB, IP);
    expect((await recordFailure(env.DB, IP, NOW)).locked).toBe(false);
    const row = await env.DB.prepare("SELECT failed_count FROM login_attempts WHERE ip = ?").bind(IP).first();
    expect(row).toEqual({ failed_count: 1 });
  });

  it("IP마다 따로 센다", async () => {
    for (let i = 0; i < 5; i += 1) await recordFailure(env.DB, IP, NOW);
    expect((await getLockStatus(env.DB, "198.51.100.1", NOW)).locked).toBe(false);
  });
});
