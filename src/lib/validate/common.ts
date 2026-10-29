export type FieldErrors = Record<string, string>;
export type Validation<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export const URL_MESSAGE = "주소는 http:// 또는 https://로 시작해야 해요.";

export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function nullable(value: string): string | null {
  return value === "" ? null : value;
}

export function charCount(value: string): number {
  return Array.from(value).length;
}

export function tagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(text).filter((item) => item !== ""))];
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
