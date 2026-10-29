import type { Work } from "../types";
import type { WorkDraft } from "../validate/work";
import { isSlugTaken, slugify, uniqueSlug } from "../works/slug";
import { sortWorks } from "../works/sort";
import { rowToWork, type WorkRow } from "./rows";

export type SaveResult =
  | { ok: true; work: Work }
  | { ok: false; status: 400 | 404; errors: Record<string, string> };

export const SLUG_TAKEN_MESSAGE = "이미 쓰고 있는 주소예요.";

function draftColumns(draft: WorkDraft) {
  return {
    title: draft.title,
    summary: draft.summary,
    description_html: draft.descriptionHtml,
    fields_json: JSON.stringify(draft.fields),
    techs_json: JSON.stringify(draft.techs),
    links_json: JSON.stringify(draft.links),
    competition: draft.competition,
    organizer: draft.organizer,
    participated_on: draft.participatedOn,
    period_start: draft.periodStart,
    period_end: draft.periodEnd,
    award: draft.award,
    team_type: draft.teamType,
    team_size: draft.teamSize,
    role: draft.role,
  };
}

export async function listAllWorks(db: D1Database): Promise<Work[]> {
  const { results } = await db.prepare("SELECT * FROM works").all<WorkRow>();
  return sortWorks(results.map(rowToWork));
}

export async function getWorkById(db: D1Database, id: string): Promise<Work | null> {
  const row = await db.prepare("SELECT * FROM works WHERE id = ?").bind(id).first<WorkRow>();
  return row ? rowToWork(row) : null;
}

export async function getWorkBySlug(db: D1Database, slug: string): Promise<Work | null> {
  const row = await db.prepare("SELECT * FROM works WHERE slug = ?").bind(slug).first<WorkRow>();
  return row ? rowToWork(row) : null;
}

export async function createWork(db: D1Database, draft: WorkDraft, now: Date): Promise<SaveResult> {
  let slug: string;
  if (draft.slug !== null) {
    if (await isSlugTaken(db, draft.slug)) return { ok: false, status: 400, errors: { slug: SLUG_TAKEN_MESSAGE } };
    slug = draft.slug;
  } else {
    slug = await uniqueSlug(db, slugify(draft.title));
  }
  const id = crypto.randomUUID();
  const timestamp = now.toISOString();
  const columns: Record<string, string | number | null> = {
    id,
    slug,
    ...draftColumns(draft),
    is_public: 0,
    is_featured: 0,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const names = Object.keys(columns);
  await db
    .prepare(`INSERT INTO works (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`)
    .bind(...Object.values(columns))
    .run();
  return { ok: true, work: (await getWorkById(db, id))! };
}

export async function updateWork(db: D1Database, id: string, draft: WorkDraft, now: Date): Promise<SaveResult> {
  const existing = await getWorkById(db, id);
  if (!existing) return { ok: false, status: 404, errors: {} };
  const slug = draft.slug ?? existing.slug;
  if (slug !== existing.slug && (await isSlugTaken(db, slug, id))) {
    return { ok: false, status: 400, errors: { slug: SLUG_TAKEN_MESSAGE } };
  }
  const columns: Record<string, string | number | null> = { slug, ...draftColumns(draft), updated_at: now.toISOString() };
  const names = Object.keys(columns);
  await db
    .prepare(`UPDATE works SET ${names.map((name) => `${name} = ?`).join(", ")} WHERE id = ?`)
    .bind(...Object.values(columns), id)
    .run();
  return { ok: true, work: (await getWorkById(db, id))! };
}

export async function setWorkFlags(
  db: D1Database,
  id: string,
  flags: { isPublic?: boolean; isFeatured?: boolean },
  now: Date,
): Promise<boolean> {
  const sets: string[] = [];
  const values: number[] = [];
  if (flags.isPublic !== undefined) {
    sets.push("is_public = ?");
    values.push(flags.isPublic ? 1 : 0);
  }
  if (flags.isFeatured !== undefined) {
    sets.push("is_featured = ?");
    values.push(flags.isFeatured ? 1 : 0);
  }
  if (sets.length === 0) return false;
  const result = await db
    .prepare(`UPDATE works SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`)
    .bind(...values, now.toISOString(), id)
    .run();
  return result.meta.changes > 0;
}

export async function deleteWork(db: D1Database, id: string): Promise<boolean> {
  const [, removed] = await db.batch([
    db.prepare("DELETE FROM files WHERE work_id = ?").bind(id),
    db.prepare("DELETE FROM works WHERE id = ?").bind(id),
  ]);
  return (removed?.meta.changes ?? 0) > 0;
}

export async function countFilesByWork(db: D1Database): Promise<Map<string, number>> {
  const { results } = await db
    .prepare("SELECT work_id, COUNT(*) AS count FROM files WHERE work_id IS NOT NULL GROUP BY work_id")
    .all<{ work_id: string; count: number }>();
  return new Map(results.map((row) => [row.work_id, row.count]));
}

export async function listTagSuggestions(db: D1Database): Promise<{ fields: string[]; techs: string[] }> {
  const works = (await db.prepare("SELECT * FROM works").all<WorkRow>()).results.map(rowToWork);
  const sorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "ko"));
  return { fields: sorted(works.flatMap((work) => work.fields)), techs: sorted(works.flatMap((work) => work.techs)) };
}
