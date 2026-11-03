import type { FileKind, FileRecord, FileStatus } from "../files/types";

interface FileRow {
  id: string;
  work_id: string | null;
  kind: string;
  r2_key: string;
  thumb_r2_key: string | null;
  original_name: string;
  relative_path: string;
  content_type: string;
  size_bytes: number;
  sort_order: number;
  status: string;
  upload_id: string | null;
  created_at: string;
}

function rowToFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    workId: row.work_id,
    kind: row.kind as FileKind,
    r2Key: row.r2_key,
    thumbR2Key: row.thumb_r2_key,
    originalName: row.original_name,
    relativePath: row.relative_path,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
    status: row.status as FileStatus,
    uploadId: row.upload_id,
    createdAt: row.created_at,
  };
}

const ORDER = "ORDER BY kind, sort_order, relative_path, original_name";

export async function getFile(db: D1Database, id: string): Promise<FileRecord | null> {
  const row = await db.prepare("SELECT * FROM files WHERE id = ?").bind(id).first<FileRow>();
  return row ? rowToFile(row) : null;
}

export async function listWorkFiles(db: D1Database, workId: string): Promise<FileRecord[]> {
  const { results } = await db
    .prepare(`SELECT * FROM files WHERE work_id = ? AND status = 'complete' ${ORDER}`)
    .bind(workId)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function listAllWorkFiles(db: D1Database, workId: string): Promise<FileRecord[]> {
  const { results } = await db.prepare("SELECT * FROM files WHERE work_id = ?").bind(workId).all<FileRow>();
  return results.map(rowToFile);
}

export async function listCoversByWork(db: D1Database): Promise<Map<string, FileRecord>> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE kind = 'cover' AND status = 'complete' AND work_id IS NOT NULL")
    .all<FileRow>();
  return new Map(results.map((row) => [row.work_id as string, rowToFile(row)]));
}

export async function getAvatar(db: D1Database): Promise<FileRecord | null> {
  const row = await db
    .prepare("SELECT * FROM files WHERE kind = 'avatar' AND status = 'complete' ORDER BY created_at DESC LIMIT 1")
    .first<FileRow>();
  return row ? rowToFile(row) : null;
}

export async function storageUsage(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COALESCE(SUM(size_bytes), 0) AS total FROM files").first<{ total: number }>();
  return row?.total ?? 0;
}

export async function insertFile(db: D1Database, file: FileRecord): Promise<void> {
  await db
    .prepare(
      `INSERT INTO files (id, work_id, kind, r2_key, thumb_r2_key, original_name, relative_path, content_type, size_bytes, sort_order, status, upload_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      file.id,
      file.workId,
      file.kind,
      file.r2Key,
      file.thumbR2Key,
      file.originalName,
      file.relativePath,
      file.contentType,
      file.sizeBytes,
      file.sortOrder,
      file.status,
      file.uploadId,
      file.createdAt,
    )
    .run();
}

// 사용량 확인, 순서 번호, 기록 저장을 한 문장으로 한다. 동시에 여러 개를 올려도 상한을 넘지 않는다.
// 상한을 넘으면 아무것도 넣지 않고 false를 돌려준다.
export async function reserveFile(
  db: D1Database,
  file: Omit<FileRecord, "sortOrder" | "uploadId" | "status">,
  limitBytes: number,
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT INTO files (id, work_id, kind, r2_key, thumb_r2_key, original_name, relative_path, content_type, size_bytes, sort_order, status, upload_id, created_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?,
         (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM files WHERE work_id IS ? AND kind = ?),
         'uploading', NULL, ?
       WHERE (SELECT COALESCE(SUM(size_bytes), 0) FROM files) + ? <= ?`,
    )
    .bind(
      file.id,
      file.workId,
      file.kind,
      file.r2Key,
      file.thumbR2Key,
      file.originalName,
      file.relativePath,
      file.contentType,
      file.sizeBytes,
      file.workId,
      file.kind,
      file.createdAt,
      file.sizeBytes,
      limitBytes,
    )
    .run();
  return result.meta.changes === 1;
}

export async function setUploadId(db: D1Database, id: string, uploadId: string): Promise<void> {
  await db.prepare("UPDATE files SET upload_id = ? WHERE id = ?").bind(uploadId, id).run();
}

export async function setThumbKey(db: D1Database, id: string, thumbKey: string): Promise<void> {
  await db.prepare("UPDATE files SET thumb_r2_key = ? WHERE id = ?").bind(thumbKey, id).run();
}

export async function markComplete(db: D1Database, id: string, sizeBytes: number, thumbKey: string | null): Promise<void> {
  await db
    .prepare("UPDATE files SET status = 'complete', upload_id = NULL, size_bytes = ?, thumb_r2_key = ? WHERE id = ?")
    .bind(sizeBytes, thumbKey, id)
    .run();
}

export async function deleteFileRows(db: D1Database, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.batch(ids.map((id) => db.prepare("DELETE FROM files WHERE id = ?").bind(id)));
}

export async function listOtherSingles(db: D1Database, file: FileRecord): Promise<FileRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE kind = ? AND work_id IS ? AND id != ? AND status = 'complete'")
    .bind(file.kind, file.workId, file.id)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function listStaleUploads(db: D1Database, before: string): Promise<FileRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM files WHERE status = 'uploading' AND created_at < ?")
    .bind(before)
    .all<FileRow>();
  return results.map(rowToFile);
}

export async function swapSortOrder(db: D1Database, a: FileRecord, b: FileRecord): Promise<void> {
  await db.batch([
    db.prepare("UPDATE files SET sort_order = ? WHERE id = ?").bind(b.sortOrder, a.id),
    db.prepare("UPDATE files SET sort_order = ? WHERE id = ?").bind(a.sortOrder, b.id),
  ]);
}
