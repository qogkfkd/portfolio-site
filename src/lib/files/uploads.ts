import { deleteWork, getWorkById } from "../db/adminWorks";
import * as files from "../db/files";
import {
  IMAGE_TYPES,
  MAX_FILE_BYTES,
  PART_SIZE,
  STORAGE_LIMIT_BYTES,
  THUMB_MAX_BYTES,
  cleanContentType,
  isImageKind,
  storageFullMessage,
  validateUploadStart,
} from "./rules";
import { toFileView, type FileRecord, type FileView } from "./types";

export type UploadResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 404; errors: Record<string, string> };

const NOT_FOUND = { ok: false, status: 404, errors: { file: "파일을 찾을 수 없어요." } } as const;
const fail = (message: string) => ({ ok: false, status: 400, errors: { file: message } }) as const;
const done = <T>(value: T) => ({ ok: true, value }) as const;

function objectKey(workId: string | null, fileId: string): string {
  return workId ? `works/${workId}/${fileId}` : `profile/${fileId}`;
}

async function pendingFile(db: D1Database, id: string): Promise<(FileRecord & { uploadId: string }) | null> {
  const file = await files.getFile(db, id);
  return file && file.status === "uploading" && file.uploadId ? { ...file, uploadId: file.uploadId } : null;
}

function parseParts(raw: unknown): R2UploadedPart[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 10_000) return null;
  const parts: R2UploadedPart[] = [];
  for (const item of raw) {
    const { partNumber, etag } = (item ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(partNumber) || (partNumber as number) < 1 || typeof etag !== "string" || etag === "") return null;
    parts.push({ partNumber: partNumber as number, etag });
  }
  return parts.sort((a, b) => a.partNumber - b.partNumber);
}

export async function startUpload(
  db: D1Database,
  bucket: R2Bucket,
  raw: unknown,
  now: Date,
): Promise<UploadResult<{ fileId: string; partSize: number }>> {
  const check = validateUploadStart(raw);
  if (!check.ok) return { ok: false, status: 400, errors: check.errors };
  const start = check.value;
  if (start.workId !== null && !(await getWorkById(db, start.workId))) {
    return { ok: false, status: 404, errors: { file: "작품을 찾을 수 없어요." } };
  }
  const id = crypto.randomUUID();
  const key = objectKey(start.workId, id);
  const reserved = await files.reserveFile(
    db,
    {
      id,
      workId: start.workId,
      kind: start.kind,
      r2Key: key,
      thumbR2Key: null,
      originalName: start.fileName,
      relativePath: start.relativePath,
      contentType: start.contentType,
      sizeBytes: start.size,
      createdAt: now.toISOString(),
    },
    STORAGE_LIMIT_BYTES,
  );
  if (!reserved) return fail(storageFullMessage(await files.storageUsage(db)));
  try {
    const upload = await bucket.createMultipartUpload(key, { httpMetadata: { contentType: start.contentType } });
    await files.setUploadId(db, id, upload.uploadId);
  } catch (error) {
    await files.deleteFileRows(db, [id]);
    throw error;
  }
  return done({ fileId: id, partSize: PART_SIZE });
}

export async function uploadPart(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  partNumber: number,
  body: ArrayBuffer,
): Promise<UploadResult<R2UploadedPart>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) return fail("조각 번호가 올바르지 않아요.");
  if (body.byteLength > PART_SIZE) return fail("조각이 너무 커요.");
  const part = await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).uploadPart(partNumber, body);
  return done({ partNumber: part.partNumber, etag: part.etag });
}

export async function uploadThumb(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<UploadResult<null>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  const type = cleanContentType(contentType);
  if (!isImageKind(file.kind) || !(IMAGE_TYPES as readonly string[]).includes(type)) return fail("썸네일은 이미지에만 붙일 수 있어요.");
  if (body.byteLength > THUMB_MAX_BYTES) return fail("썸네일이 너무 커요.");
  const thumbKey = `${file.r2Key}.thumb`;
  await bucket.put(thumbKey, body, { httpMetadata: { contentType: type } });
  await files.setThumbKey(db, id, thumbKey);
  return done(null);
}

export async function removeFile(db: D1Database, bucket: R2Bucket, file: FileRecord): Promise<void> {
  if (file.status === "uploading" && file.uploadId) {
    try {
      await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).abort();
    } catch {
      // 이미 끝났거나 사라진 업로드
    }
  }
  await bucket.delete([file.r2Key, `${file.r2Key}.thumb`]);
  await files.deleteFileRows(db, [file.id]);
}

export async function completeUpload(
  db: D1Database,
  bucket: R2Bucket,
  id: string,
  rawParts: unknown,
): Promise<UploadResult<FileView>> {
  const file = await pendingFile(db, id);
  if (!file) return NOT_FOUND;
  const parts = parseParts(rawParts);
  if (!parts) return fail("업로드 조각 정보가 올바르지 않아요.");
  const object = await bucket.resumeMultipartUpload(file.r2Key, file.uploadId).complete(parts);
  let size = object.size;
  let thumbKey = file.thumbR2Key;
  if (thumbKey) size += (await bucket.head(thumbKey))?.size ?? 0;
  else if (isImageKind(file.kind)) thumbKey = file.r2Key;
  // 시작할 때 알린 크기로 용량을 예약했으므로, 실제로 더 크면 받지 않는다.
  if (object.size > MAX_FILE_BYTES || size > file.sizeBytes) {
    await removeFile(db, bucket, { ...file, status: "complete" });
    return fail(object.size > MAX_FILE_BYTES ? "파일이 너무 커요. 1GB까지 올릴 수 있어요." : "올린 파일이 처음 알린 크기보다 커요. 다시 시도해 주세요.");
  }
  await files.markComplete(db, id, size, thumbKey);
  if (file.kind === "cover" || file.kind === "avatar") {
    for (const old of await files.listOtherSingles(db, file)) await removeFile(db, bucket, old);
  }
  return done(toFileView((await files.getFile(db, id))!));
}

export async function abortUpload(db: D1Database, bucket: R2Bucket, id: string): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file || file.status !== "uploading") return NOT_FOUND;
  await removeFile(db, bucket, file);
  return done(null);
}

export async function deleteFile(db: D1Database, bucket: R2Bucket, id: string): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file) return NOT_FOUND;
  await removeFile(db, bucket, file);
  return done(null);
}

export async function deleteWorkWithFiles(db: D1Database, bucket: R2Bucket, workId: string): Promise<boolean> {
  for (const file of await files.listAllWorkFiles(db, workId)) await removeFile(db, bucket, file);
  return deleteWork(db, workId);
}

export async function cleanupStaleUploads(db: D1Database, bucket: R2Bucket, now: Date): Promise<number> {
  const before = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const stale = await files.listStaleUploads(db, before);
  for (const file of stale) await removeFile(db, bucket, file);
  return stale.length;
}

export async function moveGalleryFile(db: D1Database, id: string, direction: "up" | "down"): Promise<UploadResult<null>> {
  const file = await files.getFile(db, id);
  if (!file || file.kind !== "gallery" || file.status !== "complete" || !file.workId) return NOT_FOUND;
  const gallery = (await files.listWorkFiles(db, file.workId)).filter((item) => item.kind === "gallery");
  const index = gallery.findIndex((item) => item.id === id);
  const other = gallery[direction === "up" ? index - 1 : index + 1];
  if (other) await files.swapSortOrder(db, file, other);
  return done(null);
}
