export const FILE_KINDS = ["cover", "gallery", "attachment", "avatar"] as const;
export type FileKind = (typeof FILE_KINDS)[number];
export type FileStatus = "uploading" | "complete";

export interface FileRecord {
  id: string;
  workId: string | null;
  kind: FileKind;
  r2Key: string;
  thumbR2Key: string | null;
  originalName: string;
  relativePath: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  status: FileStatus;
  uploadId: string | null;
  createdAt: string;
}

// 화면과 관리자 폼에 넘기는 모양. 주소는 /files/{id}/{이름}이고 썸네일은 ?v=thumb를 붙인다.
export interface FileView {
  id: string;
  kind: FileKind;
  name: string;
  relativePath: string;
  sizeBytes: number;
  url: string;
  thumbUrl: string | null;
}

export function fileUrl(file: Pick<FileRecord, "id" | "originalName">, variant: "main" | "thumb" = "main"): string {
  const base = `/files/${file.id}/${encodeURIComponent(file.originalName)}`;
  return variant === "thumb" ? `${base}?v=thumb` : base;
}

export function toFileView(file: FileRecord): FileView {
  return {
    id: file.id,
    kind: file.kind,
    name: file.originalName,
    relativePath: file.relativePath,
    sizeBytes: file.sizeBytes,
    url: fileUrl(file),
    thumbUrl: file.thumbR2Key ? fileUrl(file, "thumb") : null,
  };
}
