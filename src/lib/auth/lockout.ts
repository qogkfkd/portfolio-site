export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;

export interface LockStatus {
  locked: boolean;
  lockedUntil: string | null;
}

interface AttemptRow {
  ip: string;
  failed_count: number;
  locked_until: string | null;
}

function isActiveLock(lockedUntil: string | null, now: Date): boolean {
  return lockedUntil !== null && lockedUntil > now.toISOString();
}

export async function getLockStatus(db: D1Database, ip: string, now: Date): Promise<LockStatus> {
  const row = await db.prepare("SELECT * FROM login_attempts WHERE ip = ?").bind(ip).first<AttemptRow>();
  const lockedUntil = row?.locked_until ?? null;
  return isActiveLock(lockedUntil, now) ? { locked: true, lockedUntil } : { locked: false, lockedUntil: null };
}

export async function recordFailure(db: D1Database, ip: string, now: Date): Promise<LockStatus> {
  const row = await db.prepare("SELECT * FROM login_attempts WHERE ip = ?").bind(ip).first<AttemptRow>();
  const lockExpired = row?.locked_until != null && !isActiveLock(row.locked_until, now);
  const failedCount = (row && !lockExpired ? row.failed_count : 0) + 1;
  const lockedUntil =
    failedCount >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000).toISOString() : null;
  await db
    .prepare(
      `INSERT INTO login_attempts (ip, failed_count, locked_until, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(ip) DO UPDATE SET failed_count = excluded.failed_count, locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
    )
    .bind(ip, failedCount, lockedUntil, now.toISOString())
    .run();
  return { locked: lockedUntil !== null, lockedUntil };
}

export async function clearFailures(db: D1Database, ip: string): Promise<void> {
  await db.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
}
