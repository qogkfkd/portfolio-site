import { LINK_KINDS, isDevMethod, type LinkKind, type Profile, type ProfileLink, type TeamType, type Work, type WorkLink } from "../types";

export interface WorkRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description_html: string;
  fields_json: string;
  techs_json: string;
  links_json: string;
  competition: string | null;
  organizer: string | null;
  participated_on: string | null;
  period_start: string | null;
  period_end: string | null;
  award: string | null;
  team_type: string | null;
  team_size: number | null;
  role: string | null;
  dev_method: string | null;
  is_public: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: number;
  name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  github_url: string | null;
  links_json: string;
  updated_at: string;
}

function parseJsonArray(text: string | null): unknown[] {
  if (!text) return [];
  try {
    const value: unknown = JSON.parse(text);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function emptyToNull(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toStringList(text: string | null): string[] {
  return parseJsonArray(text)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function toWorkLinks(text: string | null): WorkLink[] {
  const links: WorkLink[] = [];
  for (const item of parseJsonArray(text)) {
    if (typeof item !== "object" || item === null) continue;
    const { kind, label, url } = item as Record<string, unknown>;
    if (!LINK_KINDS.includes(kind as LinkKind)) continue;
    if (typeof label !== "string" || !isHttpUrl(url)) continue;
    links.push({ kind: kind as LinkKind, label: label.trim(), url });
  }
  return links;
}

function toProfileLinks(text: string | null): ProfileLink[] {
  const links: ProfileLink[] = [];
  for (const item of parseJsonArray(text)) {
    if (typeof item !== "object" || item === null) continue;
    const { label, url } = item as Record<string, unknown>;
    if (typeof label !== "string" || label.trim() === "" || !isHttpUrl(url)) continue;
    links.push({ label: label.trim(), url });
  }
  return links;
}

export function rowToWork(row: WorkRow): Work {
  const teamType: TeamType | null = row.team_type === "solo" || row.team_type === "team" ? row.team_type : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: emptyToNull(row.summary),
    descriptionHtml: row.description_html,
    fields: toStringList(row.fields_json),
    techs: toStringList(row.techs_json),
    links: toWorkLinks(row.links_json),
    competition: emptyToNull(row.competition),
    organizer: emptyToNull(row.organizer),
    participatedOn: emptyToNull(row.participated_on),
    periodStart: emptyToNull(row.period_start),
    periodEnd: emptyToNull(row.period_end),
    award: emptyToNull(row.award),
    teamType,
    teamSize: teamType === "team" ? row.team_size : null,
    role: emptyToNull(row.role),
    devMethod: isDevMethod(row.dev_method) ? row.dev_method : null,
    isPublic: row.is_public === 1,
    isFeatured: row.is_featured === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToProfile(row: ProfileRow): Profile {
  const email = emptyToNull(row.email);
  return {
    name: row.name,
    headline: emptyToNull(row.headline),
    bio: emptyToNull(row.bio),
    email: email !== null && email.includes("@") ? email : null,
    githubUrl: isHttpUrl(row.github_url) ? row.github_url : null,
    links: toProfileLinks(row.links_json),
    updatedAt: row.updated_at,
  };
}
