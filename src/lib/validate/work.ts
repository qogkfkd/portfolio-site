import { isHttpUrl } from "../db/rows";
import { LINK_KINDS, type LinkKind, type TeamType, type Work, type WorkLink } from "../types";
import { isValidSlug } from "../works/slug";
import { SUMMARY_MAX, stripHtml } from "../works/summary";
import { URL_MESSAGE, charCount, isIsoDate, nullable, record, tagList, text, type FieldErrors, type Validation } from "./common";

export const TITLE_MAX = 100;
export const TAG_MAX = 30;
export const FIELDS_MAX = 10;
export const TECHS_MAX = 20;
export const LINKS_MAX = 10;
export const LINK_LABEL_MAX = 50;
export const DESCRIPTION_MAX = 100_000;

export interface WorkInput {
  title: string;
  slug: string;
  summary: string;
  descriptionHtml: string;
  fields: string[];
  techs: string[];
  links: WorkLink[];
  competition: string;
  organizer: string;
  participatedOn: string;
  periodStart: string;
  periodEnd: string;
  award: string;
  teamType: "" | TeamType;
  teamSize: string;
  role: string;
}

export interface WorkDraft {
  title: string;
  slug: string | null;
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
}

export const EMPTY_WORK_INPUT: WorkInput = {
  title: "",
  slug: "",
  summary: "",
  descriptionHtml: "",
  fields: [],
  techs: [],
  links: [],
  competition: "",
  organizer: "",
  participatedOn: "",
  periodStart: "",
  periodEnd: "",
  award: "",
  teamType: "",
  teamSize: "",
  role: "",
};

export function workToInput(work: Work): WorkInput {
  return {
    title: work.title,
    slug: work.slug,
    summary: work.summary ?? "",
    descriptionHtml: work.descriptionHtml,
    fields: work.fields,
    techs: work.techs,
    links: work.links,
    competition: work.competition ?? "",
    organizer: work.organizer ?? "",
    participatedOn: work.participatedOn ?? "",
    periodStart: work.periodStart ?? "",
    periodEnd: work.periodEnd ?? "",
    award: work.award ?? "",
    teamType: work.teamType ?? "",
    teamSize: work.teamSize === null ? "" : String(work.teamSize),
    role: work.role ?? "",
  };
}

function limited(errors: FieldErrors, key: string, value: string, max: number, message: string): string | null {
  if (charCount(value) > max) errors[key] = message;
  return nullable(value);
}

export function validateWorkInput(raw: unknown): Validation<WorkDraft> {
  const input = record(raw);
  const errors: FieldErrors = {};

  const title = text(input.title);
  if (title === "") errors.title = "작품명을 입력해 주세요.";
  else if (charCount(title) > TITLE_MAX) errors.title = "작품명은 100자까지 쓸 수 있어요.";

  const slugText = text(input.slug).toLowerCase();
  if (slugText !== "" && !isValidSlug(slugText)) {
    errors.slug = "주소에는 소문자, 한글, 숫자와 하이픈(-)만 쓸 수 있어요.";
  }

  const descriptionHtml = typeof input.descriptionHtml === "string" ? input.descriptionHtml : "";
  if (stripHtml(descriptionHtml) === "") errors.descriptionHtml = "작품 설명을 입력해 주세요.";
  else if (descriptionHtml.length > DESCRIPTION_MAX) errors.descriptionHtml = "작품 설명이 너무 길어요.";

  const fields = tagList(input.fields);
  if (fields.length === 0) errors.fields = "분야를 하나 이상 입력해 주세요.";
  else if (fields.length > FIELDS_MAX) errors.fields = "분야는 10개까지 넣을 수 있어요.";
  else if (fields.some((field) => charCount(field) > TAG_MAX)) errors.fields = "분야 이름은 30자까지 쓸 수 있어요.";

  const techs = tagList(input.techs);
  if (techs.length > TECHS_MAX) errors.techs = "사용 기술은 20개까지 넣을 수 있어요.";
  else if (techs.some((tech) => charCount(tech) > TAG_MAX)) errors.techs = "기술 이름은 30자까지 쓸 수 있어요.";

  const dates: Record<"participatedOn" | "periodStart" | "periodEnd", string | null> = {
    participatedOn: null,
    periodStart: null,
    periodEnd: null,
  };
  for (const key of ["participatedOn", "periodStart", "periodEnd"] as const) {
    const value = text(input[key]);
    if (value !== "" && !isIsoDate(value)) errors[key] = "날짜 형식이 올바르지 않아요.";
    dates[key] = nullable(value);
  }
  if (!errors.periodStart && !errors.periodEnd && dates.periodStart && dates.periodEnd && dates.periodEnd < dates.periodStart) {
    errors.periodEnd = "종료일이 시작일보다 빨라요.";
  }

  const teamTypeText = text(input.teamType);
  const teamType: TeamType | null = teamTypeText === "solo" || teamTypeText === "team" ? teamTypeText : null;
  let teamSize: number | null = null;
  if (teamType === "team") {
    const sizeText = text(input.teamSize);
    if (sizeText !== "") {
      const size = Number(sizeText);
      if (!Number.isInteger(size) || size < 2 || size > 999) errors.teamSize = "팀 인원은 2명 이상의 숫자로 입력해 주세요.";
      else teamSize = size;
    }
  }

  const links: WorkLink[] = [];
  const rawLinks = Array.isArray(input.links) ? input.links : [];
  rawLinks.forEach((item, index) => {
    const link = record(item);
    const label = text(link.label);
    const url = text(link.url);
    if (label === "" && url === "") return;
    const key = `links.${index}`;
    if (!LINK_KINDS.includes(link.kind as LinkKind)) errors[key] = "링크 종류를 골라 주세요.";
    else if (!isHttpUrl(url)) errors[key] = URL_MESSAGE;
    else if (charCount(label) > LINK_LABEL_MAX) errors[key] = "링크 이름은 50자까지 쓸 수 있어요.";
    else links.push({ kind: link.kind as LinkKind, label, url });
  });
  if (links.length > LINKS_MAX) errors.links = "링크는 10개까지 넣을 수 있어요.";

  const summary = limited(errors, "summary", text(input.summary), SUMMARY_MAX, "한 줄 요약은 120자까지 쓸 수 있어요.");
  const competition = limited(errors, "competition", text(input.competition), 100, "대회 이름은 100자까지 쓸 수 있어요.");
  const organizer = limited(errors, "organizer", text(input.organizer), 100, "주최 기관은 100자까지 쓸 수 있어요.");
  const award = limited(errors, "award", text(input.award), 50, "수상 내용은 50자까지 쓸 수 있어요.");
  const role = limited(errors, "role", text(input.role), 200, "내 역할은 200자까지 쓸 수 있어요.");

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      slug: nullable(slugText),
      summary,
      descriptionHtml,
      fields,
      techs,
      links,
      competition,
      organizer,
      ...dates,
      award,
      teamType,
      teamSize,
      role,
    },
  };
}
