import type { TeamType } from "./types";

export function formatDate(isoDate: string): string {
  return isoDate.slice(0, 10).replaceAll("-", ".");
}

export function formatPeriod(start: string | null, end: string | null): string | null {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `${formatDate(start)} –`;
  if (end) return `– ${formatDate(end)}`;
  return null;
}

export function teamLabel(type: TeamType | null, size: number | null): string | null {
  if (type === "solo") return "개인";
  if (type === "team") return size !== null && size >= 2 ? `팀 (${size}명)` : "팀";
  return null;
}
