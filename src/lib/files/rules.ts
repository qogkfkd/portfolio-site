import { charCount, record, text, type Validation } from "../validate/common";
import { FILE_KINDS, type FileKind } from "./types";

// 스펙 5.2. 용량은 10진수 GB(1GB = 1,000,000,000바이트)로 센다.
export const MAX_FILE_BYTES = 1_000_000_000;
export const STORAGE_LIMIT_BYTES = 9_500_000_000;
export const STORAGE_TOTAL_BYTES = 10_000_000_000;
export const PART_SIZE = 10 * 1024 * 1024;
export const THUMB_MAX_BYTES = 5_000_000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const IMAGE_KINDS: readonly FileKind[] = ["cover", "gallery", "avatar"];

export interface UploadStart {
  workId: string | null;
  kind: FileKind;
  fileName: string;
  relativePath: string;
  contentType: string;
  size: number;
}

export function isImageKind(kind: FileKind): boolean {
  return IMAGE_KINDS.includes(kind);
}

export function cleanFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  return Array.from(base.replace(/[\u0000-\u001f\u007f]/g, "").trim()).slice(0, 200).join("");
}

// 첨부 폴더 경로를 a/b 모양으로 정리한다. 상위 폴더(..)가 들어 있으면 null.
export function normalizeRelativePath(raw: string): string | null {
  const parts = raw.replace(/\\/g, "/").split("/").map((part) => part.trim()).filter((part) => part !== "" && part !== ".");
  if (parts.some((part) => part === "..")) return null;
  const joined = parts.join("/");
  return charCount(joined) > 300 ? null : joined;
}

export function cleanContentType(raw: string): string {
  const value = raw.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/.test(value) ? value : "application/octet-stream";
}

export function validateUploadStart(raw: unknown): Validation<UploadStart> {
  const input = record(raw);
  const kind = input.kind as FileKind;
  if (!FILE_KINDS.includes(kind)) return { ok: false, errors: { file: "파일 종류가 올바르지 않아요." } };
  const workId = text(input.workId);
  if (kind === "avatar" ? workId !== "" : workId === "") {
    return { ok: false, errors: { file: "파일을 붙일 대상이 올바르지 않아요." } };
  }
  const fileName = cleanFileName(text(input.fileName));
  if (fileName === "") return { ok: false, errors: { file: "파일 이름이 비어 있어요." } };
  const size = Number(input.size);
  if (!Number.isInteger(size) || size < 0) return { ok: false, errors: { file: "파일 크기가 올바르지 않아요." } };
  if (size > MAX_FILE_BYTES) return { ok: false, errors: { file: "파일이 너무 커요. 1GB까지 올릴 수 있어요." } };
  const contentType = cleanContentType(text(input.contentType));
  if (isImageKind(kind) && !(IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return { ok: false, errors: { file: "jpg, png, webp, gif 이미지만 올릴 수 있어요." } };
  }
  const relativePath = kind === "attachment" ? normalizeRelativePath(text(input.relativePath)) : "";
  if (relativePath === null) return { ok: false, errors: { file: "폴더 경로가 올바르지 않아요." } };
  return { ok: true, value: { workId: kind === "avatar" ? null : workId, kind, fileName, relativePath, contentType, size } };
}

export function usageLabel(usedBytes: number): string {
  return `10GB 중 ${(usedBytes / 1_000_000_000).toFixed(2)}GB 사용`;
}

export function storageFullMessage(usedBytes: number): string {
  return `저장 공간이 부족해요. 10GB 중 ${(usedBytes / 1_000_000_000).toFixed(2)}GB를 쓰고 있어요.`;
}
