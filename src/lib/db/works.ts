import type { Work } from "../types";
import { sortWorks } from "../works/sort";
import { rowToWork, type WorkRow } from "./rows";

export async function listPublicWorks(db: D1Database): Promise<Work[]> {
  const { results } = await db.prepare("SELECT * FROM works WHERE is_public = 1").all<WorkRow>();
  return sortWorks(results.map(rowToWork));
}

export async function getPublicWorkBySlug(db: D1Database, slug: string): Promise<Work | null> {
  const row = await db.prepare("SELECT * FROM works WHERE slug = ? AND is_public = 1").bind(slug).first<WorkRow>();
  return row ? rowToWork(row) : null;
}
