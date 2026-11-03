import { insertFile } from "../../src/lib/db/files";
import type { FileKind, FileRecord } from "../../src/lib/files/types";

export async function resetBucket(bucket: R2Bucket): Promise<void> {
  for (;;) {
    const listed = await bucket.list();
    if (listed.objects.length === 0) return;
    await bucket.delete(listed.objects.map((object) => object.key));
  }
}

let sequence = 0;

// 업로드 과정을 건너뛰고 완료된 파일을 바로 만든다.
export async function putCompleteFile(
  db: D1Database,
  bucket: R2Bucket,
  options: { workId: string | null; kind: FileKind; name?: string; body?: string; contentType?: string; thumbBody?: string; relativePath?: string },
): Promise<FileRecord> {
  sequence += 1;
  const id = `file-${sequence}`;
  const key = options.workId ? `works/${options.workId}/${id}` : `profile/${id}`;
  const body = options.body ?? "본문";
  const contentType = options.contentType ?? "text/plain";
  await bucket.put(key, body, { httpMetadata: { contentType } });
  let thumbKey: string | null = null;
  if (options.thumbBody !== undefined) {
    thumbKey = `${key}.thumb`;
    await bucket.put(thumbKey, options.thumbBody, { httpMetadata: { contentType } });
  }
  const file: FileRecord = {
    id,
    workId: options.workId,
    kind: options.kind,
    r2Key: key,
    thumbR2Key: thumbKey,
    originalName: options.name ?? `${id}.txt`,
    relativePath: options.relativePath ?? "",
    contentType,
    sizeBytes: new TextEncoder().encode(body).length,
    sortOrder: sequence,
    status: "complete",
    uploadId: null,
    createdAt: "2026-10-30T00:00:00.000Z",
  };
  await insertFile(db, file);
  return file;
}
