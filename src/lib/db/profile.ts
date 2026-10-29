import type { Profile } from "../types";
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
