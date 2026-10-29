import type { TeamType } from "./types";

export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

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
