import type { WorkRow } from "../../src/lib/db/rows";

export async function resetDb(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM files"),
    db.prepare("DELETE FROM works"),
    db.prepare("DELETE FROM login_attempts"),
    db.prepare(
      "UPDATE profile SET name = '이름을 입력하세요', headline = NULL, bio = NULL, email = NULL, github_url = NULL, links_json = '[]' WHERE id = 1",
    ),
  ]);
}

export async function insertWorkRow(db: D1Database, row: WorkRow): Promise<void> {
  const columns = Object.keys(row) as (keyof WorkRow)[];
  const placeholders = columns.map(() => "?").join(", ");
  await db
    .prepare(`INSERT INTO works (${columns.join(", ")}) VALUES (${placeholders})`)
    .bind(...columns.map((column) => row[column]))
    .run();
}
