import type { Work } from "../types";

type Dated = Pick<Work, "participatedOn" | "periodStart" | "createdAt">;

export function sortDateOf(work: Dated): string {
  return work.participatedOn ?? work.periodStart ?? work.createdAt.slice(0, 10);
}

export function yearOf(work: Dated): number {
  return Number(sortDateOf(work).slice(0, 4));
}

export function isAwarded(work: Pick<Work, "award">): boolean {
  return work.award !== null && work.award.trim() !== "";
}

function descending(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? 1 : -1;
}

export function compareWorks(a: Work, b: Work): number {
  return descending(sortDateOf(a), sortDateOf(b)) || descending(a.createdAt, b.createdAt);
}

export function sortWorks(works: readonly Work[]): Work[] {
  return [...works].sort(compareWorks);
}

// 대표작 영역은 수상작을 먼저 보여 주고, 그 안에서는 기존 순서를 따른다.
export function sortFeatured(works: readonly Work[]): Work[] {
  return [...works].sort((a, b) => Number(isAwarded(b)) - Number(isAwarded(a)) || compareWorks(a, b));
}
