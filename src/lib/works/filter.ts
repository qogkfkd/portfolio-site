import type { Work, WorkFilters } from "../types";
import { yearOf } from "./sort";

export function parseFilters(params: URLSearchParams): WorkFilters {
  const field = params.get("field")?.trim() ?? "";
  const year = params.get("year")?.trim() ?? "";
  return {
    field: field === "" ? null : field,
    year: /^\d{4}$/.test(year) ? Number(year) : null,
    award: params.get("award") === "1",
  };
}

export function hasActiveFilters(filters: WorkFilters): boolean {
  return filters.field !== null || filters.year !== null || filters.award;
}

export function isAwarded(work: Pick<Work, "award">): boolean {
  return work.award !== null && work.award.trim() !== "";
}

export function applyFilters(works: readonly Work[], filters: WorkFilters): Work[] {
  return works.filter(
    (work) =>
      (filters.field === null || work.fields.includes(filters.field)) &&
      (filters.year === null || yearOf(work) === filters.year) &&
      (!filters.award || isAwarded(work)),
  );
}

export function filterOptions(works: readonly Work[]): { fields: string[]; years: number[] } {
  const fields = [...new Set(works.flatMap((work) => work.fields))].sort((a, b) => a.localeCompare(b, "ko"));
  const years = [...new Set(works.map(yearOf))].sort((a, b) => b - a);
  return { fields, years };
}

export function emptyStateMessage(totalPublic: number, filters: WorkFilters): string {
  return totalPublic > 0 && hasActiveFilters(filters) ? "조건에 맞는 작품이 없어요." : "아직 공개된 작품이 없어요.";
}
