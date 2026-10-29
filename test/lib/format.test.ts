import { describe, expect, it } from "vitest";
import { formatBytes, formatDate, formatPeriod, teamLabel } from "../../src/lib/format";

describe("formatDate", () => {
  it("날짜를 점으로 구분한다", () => {
    expect(formatDate("2025-08-23")).toBe("2025.08.23");
    expect(formatDate("2025-08-23T10:00:00.000Z")).toBe("2025.08.23");
  });
});

describe("formatPeriod", () => {
  it("있는 날짜만으로 기간을 만든다", () => {
    expect(formatPeriod("2024-09-01", "2024-11-30")).toBe("2024.09.01 – 2024.11.30");
    expect(formatPeriod("2024-09-01", null)).toBe("2024.09.01 –");
    expect(formatPeriod(null, "2024-11-30")).toBe("– 2024.11.30");
    expect(formatPeriod(null, null)).toBeNull();
  });
});

describe("teamLabel", () => {
  it("개인과 팀(인원 수)을 표시한다", () => {
    expect(teamLabel("solo", null)).toBe("개인");
    expect(teamLabel("team", 4)).toBe("팀 (4명)");
    expect(teamLabel("team", null)).toBe("팀");
    expect(teamLabel(null, 3)).toBeNull();
  });
});

describe("formatBytes", () => {
  it("10진수 단위로 짧게 표시한다", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1_500)).toBe("1.5 KB");
    expect(formatBytes(3_400_000)).toBe("3.4 MB");
    expect(formatBytes(250_000_000)).toBe("250 MB");
    expect(formatBytes(2_500_000_000)).toBe("2.5 GB");
  });
});
