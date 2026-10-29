import { isHttpUrl } from "../db/rows";
import type { Profile, ProfileLink } from "../types";
import { URL_MESSAGE, charCount, nullable, record, text, type FieldErrors, type Validation } from "./common";

export const PROFILE_LINKS_MAX = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ProfileInput {
  name: string;
  headline: string;
  bio: string;
  email: string;
  githubUrl: string;
  links: ProfileLink[];
}

export interface ProfileDraft {
  name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  githubUrl: string | null;
  links: ProfileLink[];
}

export function profileToInput(profile: Profile): ProfileInput {
  return {
    name: profile.name,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    email: profile.email ?? "",
    githubUrl: profile.githubUrl ?? "",
    links: profile.links,
  };
}

export function validateProfileInput(raw: unknown): Validation<ProfileDraft> {
  const input = record(raw);
  const errors: FieldErrors = {};

  const name = text(input.name);
  if (name === "") errors.name = "이름을 입력해 주세요.";
  else if (charCount(name) > 50) errors.name = "이름은 50자까지 쓸 수 있어요.";

  const headline = text(input.headline);
  if (charCount(headline) > 100) errors.headline = "한 줄 소개는 100자까지 쓸 수 있어요.";

  const bio = typeof input.bio === "string" ? input.bio.trim() : "";
  if (charCount(bio) > 1000) errors.bio = "자기소개는 1000자까지 쓸 수 있어요.";

  const email = text(input.email);
  if (email !== "" && (!EMAIL_PATTERN.test(email) || charCount(email) > 100)) errors.email = "이메일 형식이 올바르지 않아요.";

  const githubUrl = text(input.githubUrl);
  if (githubUrl !== "" && !isHttpUrl(githubUrl)) errors.githubUrl = URL_MESSAGE;

  const links: ProfileLink[] = [];
  const rawLinks = Array.isArray(input.links) ? input.links : [];
  rawLinks.forEach((item, index) => {
    const link = record(item);
    const label = text(link.label);
    const url = text(link.url);
    if (label === "" && url === "") return;
    const key = `links.${index}`;
    if (label === "") errors[key] = "링크 이름을 입력해 주세요.";
    else if (charCount(label) > 30) errors[key] = "링크 이름은 30자까지 쓸 수 있어요.";
    else if (!isHttpUrl(url)) errors[key] = URL_MESSAGE;
    else links.push({ label, url });
  });
  if (links.length > PROFILE_LINKS_MAX) errors.links = "링크는 10개까지 넣을 수 있어요.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name, headline: nullable(headline), bio: nullable(bio), email: nullable(email), githubUrl: nullable(githubUrl), links },
  };
}
