import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { contentDisposition, serveFile } from "../../src/lib/files/serve";
import { isViewableType, toFileView } from "../../src/lib/files/types";
import { insertWorkRow, resetDb } from "../helpers/db";
import { makeWorkRow } from "../helpers/factories";
import { putCompleteFile, resetBucket } from "../helpers/files";

const request = (id: string, init: { thumb?: boolean; view?: boolean; range?: string } = {}) =>
  new Request(`https://example.com/files/${id}/x${init.thumb ? "?v=thumb" : init.view ? "?v=view" : ""}`, {
    headers: init.range ? { Range: init.range } : {},
  });

beforeEach(async () => {
  await resetDb(env.DB);
  await resetBucket(env.FILES);
  await insertWorkRow(env.DB, makeWorkRow({ id: "pub", slug: "pub", is_public: 1 }));
  await insertWorkRow(env.DB, makeWorkRow({ id: "priv", slug: "priv", is_public: 0 }));
});

describe("serveFile", () => {
  it("공개 작품의 첨부파일은 내려받기 머리글과 함께 누구에게나 준다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", name: "최종 보고서.pdf", body: "PDF", contentType: "application/pdf" });
    const res = await serveFile(env.DB, env.FILES, request(file.id), file.id, false);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("PDF");
    expect(res.headers.get("Content-Disposition")).toBe(
      "attachment; filename=\"__ ___.pdf\"; filename*=UTF-8''%EC%B5%9C%EC%A2%85%20%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf",
    );
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
  });

  it("비공개 작품의 파일은 방문자에게 404, 관리자에게는 캐시 없이 준다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "priv", kind: "gallery", contentType: "image/png" });
    expect((await serveFile(env.DB, env.FILES, request(file.id), file.id, false)).status).toBe(404);
    const admin = await serveFile(env.DB, env.FILES, request(file.id), file.id, true);
    expect(admin.status).toBe(200);
    expect(admin.headers.get("Cache-Control")).toBe("private, no-store");
    expect(admin.headers.get("Content-Disposition")).toMatch(/^inline;/);
  });

  it("프로필 사진은 항상 공개하고, 썸네일 주소는 썸네일을 준다", async () => {
    const avatar = await putCompleteFile(env.DB, env.FILES, { workId: null, kind: "avatar", body: "큰 사진", thumbBody: "작은 사진", contentType: "image/webp" });
    expect(await (await serveFile(env.DB, env.FILES, request(avatar.id), avatar.id, false)).text()).toBe("큰 사진");
    expect(await (await serveFile(env.DB, env.FILES, request(avatar.id, { thumb: true }), avatar.id, false)).text()).toBe("작은 사진");
  });

  it("업로드 중이거나 없는 파일은 404", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment" });
    await env.DB.prepare("UPDATE files SET status = 'uploading' WHERE id = ?").bind(file.id).run();
    expect((await serveFile(env.DB, env.FILES, request(file.id), file.id, true)).status).toBe(404);
    expect((await serveFile(env.DB, env.FILES, request("none"), "none", true)).status).toBe(404);
  });

  it("Range 요청에 206과 Content-Range로 답하고, 범위가 틀리면 416", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", body: "0123456789" });
    const partial = await serveFile(env.DB, env.FILES, request(file.id, { range: "bytes=2-5" }), file.id, false);
    expect(partial.status).toBe(206);
    expect(partial.headers.get("Content-Range")).toBe("bytes 2-5/10");
    expect(await partial.text()).toBe("2345");
    const invalid = await serveFile(env.DB, env.FILES, request(file.id, { range: "bytes=20-" }), file.id, false);
    expect(invalid.status).toBe(416);
    expect(invalid.headers.get("Content-Range")).toBe("bytes */10");
  });
});

describe("바로 보기", () => {
  it("PDF 첨부는 ?v=view에서 inline으로 주고, 보안 머리글은 그대로 둔다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", name: "대회.pdf", body: "PDF", contentType: "application/pdf" });
    const res = await serveFile(env.DB, env.FILES, request(file.id, { view: true }), file.id, false);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toMatch(/^inline;/);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    await res.body?.cancel();
  });

  it("허용하지 않은 형식은 ?v=view여도 내려받기로 준다", async () => {
    for (const [name, contentType] of [["계획.hwp", "application/x-hwp"], ["a.html", "text/html"], ["a.svg", "image/svg+xml"]] as const) {
      const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", name, body: "x", contentType });
      const res = await serveFile(env.DB, env.FILES, request(file.id, { view: true }), file.id, false);
      expect(res.headers.get("Content-Disposition")).toMatch(/^attachment;/);
      await res.body?.cancel();
    }
  });

  it("주소에 ?v=view가 없으면 PDF도 내려받기로 준다", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", name: "a.pdf", body: "PDF", contentType: "application/pdf" });
    const res = await serveFile(env.DB, env.FILES, request(file.id), file.id, false);
    expect(res.headers.get("Content-Disposition")).toMatch(/^attachment;/);
    await res.body?.cancel();
  });

  it("비공개 작품의 파일은 ?v=view여도 방문자에게 404", async () => {
    const file = await putCompleteFile(env.DB, env.FILES, { workId: "priv", kind: "attachment", name: "a.pdf", body: "PDF", contentType: "application/pdf" });
    const res = await serveFile(env.DB, env.FILES, request(file.id, { view: true }), file.id, false);
    expect(res.status).toBe(404);
  });

  it("보기 주소는 허용한 형식의 첨부파일에만 만든다", async () => {
    const pdf = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", name: "a.pdf", body: "x", contentType: "application/pdf" });
    const hwp = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "attachment", name: "a.hwp", body: "x", contentType: "application/x-hwp" });
    const cover = await putCompleteFile(env.DB, env.FILES, { workId: "pub", kind: "cover", name: "a.webp", body: "x", contentType: "image/webp" });
    expect(toFileView(pdf).viewUrl).toBe(`/files/${pdf.id}/a.pdf?v=view`);
    expect(toFileView(hwp).viewUrl).toBeNull();
    expect(toFileView(cover).viewUrl).toBeNull();
    expect(isViewableType(" Application/PDF ")).toBe(true);
    expect(isViewableType("image/svg+xml")).toBe(false);
  });
});

describe("contentDisposition", () => {
  it("이미지는 inline, 첨부는 attachment", () => {
    expect(contentDisposition("cover", "a.png")).toBe("inline; filename=\"a.png\"; filename*=UTF-8''a.png");
    expect(contentDisposition("attachment", "it's (1).zip")).toBe(
      "attachment; filename=\"it's (1).zip\"; filename*=UTF-8''it%27s%20%281%29.zip",
    );
  });
});
