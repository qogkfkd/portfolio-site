import type { FileView } from "./types";

export interface AttachmentGroup {
  folder: string;
  files: FileView[];
}

// 첨부파일을 폴더 경로별로 묶는다. 폴더 없는 파일이 먼저, 나머지는 가나다순.
export function groupAttachments(files: FileView[]): AttachmentGroup[] {
  const groups = new Map<string, FileView[]>();
  for (const file of files) groups.set(file.relativePath, [...(groups.get(file.relativePath) ?? []), file]);
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b, "ko")))
    .map(([folder, list]) => ({ folder, files: [...list].sort((x, y) => x.name.localeCompare(y.name, "ko")) }));
}
