import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { getWorkById } from "../../src/lib/db/adminWorks";
import { getFile, listWorkFiles, storageUsage } from "../../src/lib/db/files";
import { PART_SIZE } from "../../src/lib/files/rules";
import {
  abortUpload,
  cleanupStaleUploads,
  completeUpload,
  deleteFile,
  deleteWorkWithFiles,
  moveGalleryFile,
  startUpload,
  uploadPart,
  uploadThumb,
} from "../../src/lib/files/uploads";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";
import { putCompleteFile, resetBucket } from "../helpers/files";

const NOW = new Date("2026-10-30T00:00:00.000Z");
const bytes = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;

async function uploadText(kind: "attachment" | "cover" | "gallery", text: string, extra: Record<string, unknown> = {}) {
  const size = bytes(text).byteLength;
  const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind, fileName: "a.txt", relativePath: "", contentType: "text/plain", size, ...extra }, NOW);
  if (!started.ok) throw new Error(JSON.stringify(started.errors));
  const part = await uploadPart(env.DB, env.FILES, started.value.fileId, 1, bytes(text));
  if (!part.ok) throw new Error("part");
  return { fileId: started.value.fileId, part: part.value };
}

beforeEach(async () => {
  await resetDb(env.DB);
  await resetBucket(env.FILES);
  await insertWorkRow(env.DB, makeWorkRow({ id: "w1", slug: "w1" }));
});

describe("업로드 흐름", () => {
  it("시작하면 uploading 기록과 조각 크기를 돌려주고, 선언한 크기를 사용량에 넣는다", async () => {
    const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "보고서.pdf", relativePath: "자료", contentType: "application/pdf", size: 1234 }, NOW);
    expect(started.ok && started.value.partSize).toBe(PART_SIZE);
    if (!started.ok) return;
    expect(await getFile(env.DB, started.value.fileId)).toMatchObject({ status: "uploading", relativePath: "자료", r2Key: `works/w1/${started.value.fileId}` });
    expect(await storageUsage(env.DB)).toBe(1234);
  });

  it("조각을 올리고 완료하면 complete가 되고 실제 크기를 남긴다", async () => {
    const { fileId, part } = await uploadText("attachment", "첨부 내용");
    const completed = await completeUpload(env.DB, env.FILES, fileId, [part]);
    expect(completed.ok && completed.value).toMatchObject({ id: fileId, kind: "attachment", url: `/files/${fileId}/a.txt`, thumbUrl: null });
    const file = await getFile(env.DB, fileId);
    expect(file).toMatchObject({ status: "complete", uploadId: null, sizeBytes: bytes("첨부 내용").byteLength });
    expect(await (await env.FILES.get(file!.r2Key))!.text()).toBe("첨부 내용");
  });

  it("10MiB 조각 두 개로 나눈 파일도 합친다", async () => {
    const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "big.bin", relativePath: "", contentType: "", size: PART_SIZE + 3 }, NOW);
    if (!started.ok) throw new Error("start");
    const first = await uploadPart(env.DB, env.FILES, started.value.fileId, 1, new Uint8Array(PART_SIZE).buffer);
    const second = await uploadPart(env.DB, env.FILES, started.value.fileId, 2, new Uint8Array(3).buffer);
    if (!first.ok || !second.ok) throw new Error("parts");
    const completed = await completeUpload(env.DB, env.FILES, started.value.fileId, [second.value, first.value]);
    expect(completed.ok && completed.value.sizeBytes).toBe(PART_SIZE + 3);
  });

  it("이미지는 썸네일 크기를 합쳐 세고, 썸네일이 없으면 원본을 썸네일로 쓴다", async () => {
    const withThumb = await uploadText("gallery", "원본", { contentType: "image/webp", size: bytes("원본").byteLength + bytes("썸").byteLength });
    expect((await uploadThumb(env.DB, env.FILES, withThumb.fileId, bytes("썸"), "image/webp")).ok).toBe(true);
    await completeUpload(env.DB, env.FILES, withThumb.fileId, [withThumb.part]);
    const thumbFile = await getFile(env.DB, withThumb.fileId);
    expect(thumbFile).toMatchObject({ thumbR2Key: `${thumbFile!.r2Key}.thumb`, sizeBytes: bytes("원본").byteLength + bytes("썸").byteLength });

    const gif = await uploadText("gallery", "움짤", { contentType: "image/gif" });
    await completeUpload(env.DB, env.FILES, gif.fileId, [gif.part]);
    const gifFile = await getFile(env.DB, gif.fileId);
    expect(gifFile!.thumbR2Key).toBe(gifFile!.r2Key);
  });

  it("전체 용량을 넘기거나 없는 작품이면 거절한다", async () => {
    await env.DB.prepare(
      "INSERT INTO files (id, work_id, kind, r2_key, original_name, content_type, size_bytes, status, created_at) VALUES ('big', 'w1', 'attachment', 'k', 'big', 'x/y', 9400000000, 'complete', 'now')",
    ).run();
    expect(await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "a", contentType: "", size: 200_000_000 }, NOW)).toEqual({
      ok: false,
      status: 400,
      errors: { file: "저장 공간이 부족해요. 10GB 중 9.40GB를 쓰고 있어요." },
    });
    expect(await startUpload(env.DB, env.FILES, { workId: "none", kind: "attachment", fileName: "a", contentType: "", size: 1 }, NOW)).toEqual({
      ok: false,
      status: 404,
      errors: { file: "작품을 찾을 수 없어요." },
    });
  });

  it("동시에 시작해도 전체 용량 상한을 넘지 않는다", async () => {
    await env.DB.prepare(
      "INSERT INTO files (id, work_id, kind, r2_key, original_name, content_type, size_bytes, status, created_at) VALUES ('big', 'w1', 'attachment', 'k', 'big', 'x/y', 9400000000, 'complete', 'now')",
    ).run();
    const request = { workId: "w1", kind: "attachment", fileName: "a", contentType: "", size: 100_000_000 };
    const results = await Promise.all([1, 2, 3].map(() => startUpload(env.DB, env.FILES, request, NOW)));
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(await storageUsage(env.DB)).toBe(9_500_000_000);
  });

  it("완료할 때 실제 크기가 알린 크기보다 크면 거절하고 지운다", async () => {
    const started = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "a", contentType: "", size: 1 }, NOW);
    if (!started.ok) throw new Error("start");
    const part = await uploadPart(env.DB, env.FILES, started.value.fileId, 1, bytes("다섯 글자"));
    if (!part.ok) throw new Error("part");
    expect(await completeUpload(env.DB, env.FILES, started.value.fileId, [part.value])).toEqual({
      ok: false,
      status: 400,
      errors: { file: "올린 파일이 처음 알린 크기보다 커요. 다시 시도해 주세요." },
    });
    expect(await getFile(env.DB, started.value.fileId)).toBeNull();
  });

  it("대표 이미지를 새로 올리면 이전 대표 이미지를 지운다", async () => {
    const old = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "cover", contentType: "image/png" });
    const next = await uploadText("cover", "새 표지", { contentType: "image/png" });
    await completeUpload(env.DB, env.FILES, next.fileId, [next.part]);
    expect(await getFile(env.DB, old.id)).toBeNull();
    expect(await env.FILES.head(old.r2Key)).toBeNull();
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([next.fileId]);
  });

  it("중단하면 기록이 사라지고, 끝난 업로드에는 조각을 더 올릴 수 없다", async () => {
    const { fileId } = await uploadText("attachment", "중단");
    expect(await abortUpload(env.DB, env.FILES, fileId)).toEqual({ ok: true, value: null });
    expect(await getFile(env.DB, fileId)).toBeNull();
    expect(await uploadPart(env.DB, env.FILES, fileId, 1, bytes("x"))).toEqual({
      ok: false,
      status: 404,
      errors: { file: "파일을 찾을 수 없어요." },
    });
  });
});

describe("파일 정리", () => {
  it("파일 하나를 지우면 R2 객체와 썸네일도 지운다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png", thumbBody: "썸" });
    expect(await deleteFile(env.DB, env.FILES, file.id)).toEqual({ ok: true, value: null });
    expect(await env.FILES.head(file.r2Key)).toBeNull();
    expect(await env.FILES.head(file.thumbR2Key!)).toBeNull();
  });

  it("작품을 지우면 그 작품의 파일과 R2 객체가 모두 사라진다", async () => {
    const a = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "attachment" });
    const b = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "cover", contentType: "image/png" });
    expect(await deleteWorkWithFiles(env.DB, env.FILES, "w1")).toBe(true);
    expect(await getWorkById(env.DB, "w1")).toBeNull();
    expect(await env.FILES.head(a.r2Key)).toBeNull();
    expect(await env.FILES.head(b.r2Key)).toBeNull();
    expect(await storageUsage(env.DB)).toBe(0);
  });

  it("24시간 넘게 uploading으로 남은 기록만 정리한다", async () => {
    const yesterday = new Date(NOW.getTime() - 25 * 60 * 60 * 1000);
    const stale = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "old", contentType: "", size: 1 }, yesterday);
    const fresh = await startUpload(env.DB, env.FILES, { workId: "w1", kind: "attachment", fileName: "new", contentType: "", size: 1 }, NOW);
    if (!stale.ok || !fresh.ok) throw new Error("start");
    expect(await cleanupStaleUploads(env.DB, env.FILES, NOW)).toBe(1);
    expect(await getFile(env.DB, stale.value.fileId)).toBeNull();
    expect(await getFile(env.DB, fresh.value.fileId)).not.toBeNull();
  });

  it("스크린샷 순서를 위아래로 바꾼다", async () => {
    const first = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png" });
    const second = await putCompleteFile(env.DB, env.FILES, { workId: "w1", kind: "gallery", contentType: "image/png" });
    await moveGalleryFile(env.DB, second.id, "up");
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([second.id, first.id]);
    await moveGalleryFile(env.DB, second.id, "up");
    expect((await listWorkFiles(env.DB, "w1")).map((file) => file.id)).toEqual([second.id, first.id]);
  });
});
