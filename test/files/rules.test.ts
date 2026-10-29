import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  PART_SIZE,
  STORAGE_LIMIT_BYTES,
  cleanFileName,
  normalizeRelativePath,
  storageFullMessage,
  usageLabel,
  validateUploadStart,
} from "../../src/lib/files/rules";

const attachment = { workId: "w1", kind: "attachment", fileName: "보고서.pdf", relativePath: "", contentType: "application/pdf", size: 1234 };

describe("업로드 규칙 상수", () => {
  it("스펙 5.2의 값을 쓴다", () => {
    expect(MAX_FILE_BYTES).toBe(1_000_000_000);
    expect(STORAGE_LIMIT_BYTES).toBe(9_500_000_000);
    expect(PART_SIZE).toBe(10 * 1024 * 1024);
  });
});

describe("validateUploadStart", () => {
  it("첨부파일은 종류 제한 없이 받고 폴더 경로를 정리한다", () => {
    expect(validateUploadStart({ ...attachment, relativePath: "자료\\디자인/./최종", contentType: "" })).toEqual({
      ok: true,
      value: { workId: "w1", kind: "attachment", fileName: "보고서.pdf", relativePath: "자료/디자인/최종", contentType: "application/octet-stream", size: 1234 },
    });
  });

  it("이미지 칸에는 jpg, png, webp, gif만 받는다", () => {
    expect(validateUploadStart({ ...attachment, kind: "gallery", contentType: "image/svg+xml" })).toEqual({
      ok: false,
      errors: { file: "jpg, png, webp, gif 이미지만 올릴 수 있어요." },
    });
    expect(validateUploadStart({ ...attachment, kind: "cover", contentType: "image/webp" }).ok).toBe(true);
  });

  it("1GB를 넘으면 거절한다", () => {
    expect(validateUploadStart({ ...attachment, size: MAX_FILE_BYTES + 1 })).toEqual({
      ok: false,
      errors: { file: "파일이 너무 커요. 1GB까지 올릴 수 있어요." },
    });
    expect(validateUploadStart({ ...attachment, size: MAX_FILE_BYTES }).ok).toBe(true);
  });

  it("프로필 사진은 작품 없이, 나머지는 작품에 붙인다", () => {
    expect(validateUploadStart({ ...attachment, kind: "avatar", contentType: "image/png" }).ok).toBe(false);
    const avatar = validateUploadStart({ ...attachment, kind: "avatar", workId: "", contentType: "image/png" });
    expect(avatar.ok && avatar.value.workId).toBeNull();
    expect(validateUploadStart({ ...attachment, workId: "" })).toEqual({
      ok: false,
      errors: { file: "파일을 붙일 대상이 올바르지 않아요." },
    });
  });

  it("상위 폴더(..)가 들어간 경로와 빈 이름은 거절한다", () => {
    expect(validateUploadStart({ ...attachment, relativePath: "a/../b" })).toEqual({
      ok: false,
      errors: { file: "폴더 경로가 올바르지 않아요." },
    });
    expect(validateUploadStart({ ...attachment, fileName: "  " })).toEqual({ ok: false, errors: { file: "파일 이름이 비어 있어요." } });
  });
});

describe("이름과 경로 정리", () => {
  it("파일 이름에서 폴더와 제어 문자를 지운다", () => {
    expect(cleanFileName("../../비밀\u0000.png")).toBe("비밀.png");
    expect(cleanFileName("C:\\Users\\me\\사진.jpg")).toBe("사진.jpg");
  });

  it("빈 칸과 점(.)을 빼고 / 로 잇는다", () => {
    expect(normalizeRelativePath("/a//b/./c/")).toBe("a/b/c");
    expect(normalizeRelativePath("")).toBe("");
    expect(normalizeRelativePath("..")).toBeNull();
  });

  it("사용량 표시", () => {
    expect(usageLabel(0)).toBe("10GB 중 0.00GB 사용");
    expect(usageLabel(1_234_000_000)).toBe("10GB 중 1.23GB 사용");
  });

  it("저장 공간 부족 안내", () => {
    expect(storageFullMessage(9_400_000_000)).toBe("저장 공간이 부족해요. 10GB 중 9.40GB를 쓰고 있어요.");
  });
});
