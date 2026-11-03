import type { WorkRow } from "../../src/lib/db/rows";
import type { Work } from "../../src/lib/types";

let sequence = 0;

export function makeWorkRow(overrides: Partial<WorkRow> = {}): WorkRow {
  sequence += 1;
  return {
    id: `w-${sequence}`,
    slug: `work-${sequence}`,
    title: `작품 ${sequence}`,
    summary: null,
    description_html: "<p>설명</p>",
    fields_json: '["개발"]',
    techs_json: "[]",
    links_json: "[]",
    competition: null,
    organizer: null,
    participated_on: null,
    period_start: null,
    period_end: null,
    award: null,
    team_type: null,
    team_size: null,
    role: null,
    dev_method: null,
    is_public: 1,
    is_featured: 0,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeWork(overrides: Partial<Work> = {}): Work {
  sequence += 1;
  return {
    id: `w-${sequence}`,
    slug: `work-${sequence}`,
    title: `작품 ${sequence}`,
    summary: null,
    descriptionHtml: "<p>설명</p>",
    fields: ["개발"],
    techs: [],
    links: [],
    competition: null,
    organizer: null,
    participatedOn: null,
    periodStart: null,
    periodEnd: null,
    award: null,
    teamType: null,
    teamSize: null,
    role: null,
    devMethod: null,
    isPublic: true,
    isFeatured: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}
