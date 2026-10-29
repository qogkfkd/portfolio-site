export const SLUG_MAX = 60;
const SLUG_PATTERN = /^[\p{Ll}\p{Lo}\p{Nd}]+(?:-[\p{Ll}\p{Lo}\p{Nd}]+)*$/u;

export function slugify(title: string): string {
  const base = title
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const cut = Array.from(base).slice(0, SLUG_MAX).join("").replace(/-+$/, "");
  return cut === "" ? "work" : cut;
}

export function isValidSlug(slug: string): boolean {
  return Array.from(slug).length <= SLUG_MAX && SLUG_PATTERN.test(slug);
}

export async function isSlugTaken(db: D1Database, slug: string, excludeId: string | null = null): Promise<boolean> {
  const row = await db
    .prepare("SELECT id FROM works WHERE slug = ? AND id != ?")
    .bind(slug, excludeId ?? "")
    .first();
  return row !== null;
}

export async function uniqueSlug(db: D1Database, base: string, excludeId: string | null = null): Promise<string> {
  for (let n = 1; ; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!(await isSlugTaken(db, candidate, excludeId))) return candidate;
  }
}
