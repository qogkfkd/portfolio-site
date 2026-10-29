import type { Profile } from "../types";
import type { ProfileDraft } from "../validate/profile";
import { rowToProfile, type ProfileRow } from "./rows";

export const DEFAULT_PROFILE_NAME = "이름을 입력하세요";

export async function getProfile(db: D1Database): Promise<Profile> {
  const row = await db.prepare("SELECT * FROM profile WHERE id = 1").first<ProfileRow>();
  if (row) return rowToProfile(row);
  return {
    name: DEFAULT_PROFILE_NAME,
    headline: null,
    bio: null,
    email: null,
    githubUrl: null,
    links: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export async function updateProfile(db: D1Database, draft: ProfileDraft, now: Date): Promise<Profile> {
  await db
    .prepare(
      "UPDATE profile SET name = ?, headline = ?, bio = ?, email = ?, github_url = ?, links_json = ?, updated_at = ? WHERE id = 1",
    )
    .bind(draft.name, draft.headline, draft.bio, draft.email, draft.githubUrl, JSON.stringify(draft.links), now.toISOString())
    .run();
  return getProfile(db);
}
