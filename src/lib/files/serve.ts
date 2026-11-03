import { getWorkById } from "../db/adminWorks";
import { getFile } from "../db/files";
import { parseRange } from "./range";
import { isViewableType, type FileKind } from "./types";

// RFC 5987: 한글 파일명은 filename*=UTF-8''로 보내고, 옛 브라우저용 filename에는 ASCII만 남긴다.
export function contentDisposition(kind: FileKind, name: string, view = false): string {
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `${kind === "attachment" && !view ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "X-Content-Type-Options": "nosniff" } });
}

export async function serveFile(
  db: D1Database,
  bucket: R2Bucket,
  request: Request,
  id: string,
  isAdmin: boolean,
): Promise<Response> {
  const file = await getFile(db, id);
  if (!file || file.status !== "complete") return notFound();
  let isPublic = file.kind === "avatar";
  if (file.workId) {
    const work = await getWorkById(db, file.workId);
    if (!work) return notFound();
    isPublic = work.isPublic;
  }
  if (!isPublic && !isAdmin) return notFound();

  const variant = new URL(request.url).searchParams.get("v");
  const key = variant === "thumb" ? (file.thumbR2Key ?? file.r2Key) : file.r2Key;
  // 허용한 형식의 첨부파일만 바로 보여 준다. 보안 머리글은 내려받을 때와 같다.
  const view = variant === "view" && isViewableType(file.contentType);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": isPublic ? "public, max-age=86400" : "private, no-store",
    "Content-Disposition": contentDisposition(file.kind, file.originalName, view),
    "X-Content-Type-Options": "nosniff",
  });
  if (file.kind === "attachment") headers.set("Content-Security-Policy", "default-src 'none'; sandbox");

  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    const head = await bucket.head(key);
    if (!head) return notFound();
    const range = parseRange(rangeHeader, head.size);
    if (range === "invalid") {
      headers.set("Content-Range", `bytes */${head.size}`);
      return new Response(null, { status: 416, headers });
    }
    if (range) {
      const part = await bucket.get(key, { range });
      if (!part) return notFound();
      headers.set("Content-Type", part.httpMetadata?.contentType ?? file.contentType);
      headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`);
      headers.set("ETag", part.httpEtag);
      return new Response(part.body, { status: 206, headers });
    }
  }

  const object = await bucket.get(key);
  if (!object) return notFound();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? file.contentType);
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}
