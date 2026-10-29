import type { Work } from "../types";

type Dated = Pick<Work, "participatedOn" | "periodStart" | "createdAt">;

export function sortDateOf(work: Dated): string {
  return work.participatedOn ?? work.periodStart ?? work.createdAt.slice(0, 10);
}

export function yearOf(work: Dated): number {
  return Number(sortDateOf(work).slice(0, 4));
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
