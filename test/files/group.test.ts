import { describe, expect, it } from "vitest";
import { groupAttachments } from "../../src/lib/files/group";
import type { FileView } from "../../src/lib/files/types";

const view = (name: string, relativePath: string): FileView => ({
  id: name,
  kind: "attachment",
  name,
  relativePath,
  sizeBytes: 1,
  url: `/files/${name}/${name}`,
  thumbUrl: null,
});

describe("groupAttachments", () => {
  it("폴더 없는 파일을 먼저, 나머지 폴더는 가나다순으로 묶고 파일도 정렬한다", () => {
    const groups = groupAttachments([view("나.txt", "자료/최종"), view("b.zip", ""), view("가.txt", "자료/최종"), view("a.pdf", ""), view("x.png", "디자인")]);
    expect(groups.map((group) => [group.folder, group.files.map((file) => file.name)])).toEqual([
      ["", ["a.pdf", "b.zip"]],
      ["디자인", ["x.png"]],
      ["자료/최종", ["가.txt", "나.txt"]],
    ]);
  });

  it("빈 목록이면 빈 배열", () => {
    expect(groupAttachments([])).toEqual([]);
  });
});
