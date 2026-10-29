export const LINK_KINDS = ["github", "demo", "video", "other"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  github: "GitHub",
  demo: "데모",
  video: "영상",
  other: "링크",
};

export interface WorkLink {
  kind: LinkKind;
  label: string;
  url: string;
}

export type TeamType = "solo" | "team";

export interface Work {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  descriptionHtml: string;
  fields: string[];
  techs: string[];
  links: WorkLink[];
  competition: string | null;
  organizer: string | null;
  participatedOn: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  award: string | null;
  teamType: TeamType | null;
  teamSize: number | null;
  role: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  githubUrl: string | null;
  links: ProfileLink[];
  updatedAt: string;
}

export interface WorkFilters {
  field: string | null;
  year: number | null;
  award: boolean;
}
