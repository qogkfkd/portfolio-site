import type { FileKind, FileView } from "../../lib/files/types";
import { processImage } from "./image";

export class UploadError extends Error {}

export interface UploadJobInput {
  file: File;
  kind: FileKind;
  relativePath: string;
  workId: string | null;
}

interface CallResult {
  status: number;
  data: Record<string, unknown> | null;
}

async function call(url: string, init: RequestInit): Promise<CallResult> {
  const response = await fetch(url, { credentials: "same-origin", ...init });
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: response.status, data };
}

function errorText(result: CallResult, fallback: string): string {
  const errors = result.data?.errors as Record<string, string> | undefined;
  if (result.status === 401) return "로그인이 풀렸어요. 다시 로그인한 뒤 올려 주세요.";
  return errors?.file ?? fallback;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

// 시작 → 조각(10MiB씩 순서대로) → 썸네일 → 완료. 중간에 실패하면 중단 요청을 보낸다.
export async function uploadFile(job: UploadJobInput, onProgress: (ratio: number) => void): Promise<FileView> {
  let main: Blob = job.file;
  let thumb: Blob | null = null;
  let name = job.file.name;
  let contentType = job.file.type;
  if (job.kind !== "attachment") {
    try {
      ({ main, thumb, name, contentType } = await processImage(job.file));
    } catch {
      throw new UploadError("이미지를 읽지 못했어요. jpg, png, webp, gif인지 확인해 주세요.");
    }
  }

  const start = await call("/api/admin/uploads", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      workId: job.workId ?? "",
      kind: job.kind,
      fileName: name,
      relativePath: job.relativePath,
      contentType,
      size: main.size + (thumb?.size ?? 0),
    }),
  });
  if (start.status !== 201) throw new UploadError(errorText(start, "올리기를 시작하지 못했어요."));
  const fileId = String(start.data?.fileId);
  const partSize = Number(start.data?.partSize);

  try {
    const total = Math.max(1, Math.ceil(main.size / partSize));
    const parts: unknown[] = [];
    for (let index = 0; index < total; index += 1) {
      const result = await call(`/api/admin/uploads/${fileId}/parts/${index + 1}`, {
        method: "PUT",
        body: main.slice(index * partSize, (index + 1) * partSize),
      });
      if (result.status !== 200) throw new UploadError(errorText(result, "올리는 중에 끊겼어요. 다시 시도해 주세요."));
      parts.push(result.data);
      onProgress(((index + 1) / total) * 0.95);
    }
    if (thumb) {
      const result = await call(`/api/admin/uploads/${fileId}/thumb`, {
        method: "PUT",
        headers: { "Content-Type": thumb.type },
        body: thumb,
      });
      if (result.status !== 200) throw new UploadError(errorText(result, "썸네일을 올리지 못했어요."));
    }
    const done = await call(`/api/admin/uploads/${fileId}/complete`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ parts }),
    });
    if (done.status !== 200) throw new UploadError(errorText(done, "마무리하지 못했어요. 다시 시도해 주세요."));
    onProgress(1);
    return done.data?.file as FileView;
  } catch (error) {
    await fetch(`/api/admin/uploads/${fileId}/abort`, { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    throw error instanceof UploadError ? error : new UploadError("올리는 중에 끊겼어요. 다시 시도해 주세요.");
  }
}

// 끌어다 놓은 폴더를 펼친다. relativePath는 파일이 든 폴더 경로(파일 이름 제외).
export async function filesFromDrop(items: DataTransferItemList): Promise<{ file: File; relativePath: string }[]> {
  const out: { file: File; relativePath: string }[] = [];
  const readAll = async (reader: FileSystemDirectoryReader) => {
    const all: FileSystemEntry[] = [];
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
      if (batch.length === 0) return all;
      all.push(...batch);
    }
  };
  const walk = async (entry: FileSystemEntry, folder: string): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
      out.push({ file, relativePath: folder });
    } else if (entry.isDirectory) {
      const next = folder ? `${folder}/${entry.name}` : entry.name;
      for (const child of await readAll((entry as FileSystemDirectoryEntry).createReader())) await walk(child, next);
    }
  };
  const entries = Array.from(items)
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => entry !== null);
  for (const entry of entries) await walk(entry, "");
  return out;
}

export function folderOf(file: File): string {
  const path = file.webkitRelativePath;
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}
