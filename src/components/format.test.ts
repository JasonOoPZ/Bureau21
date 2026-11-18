import { describe, expect, test } from "vitest";
import { formatGameDate, formatGameDateTime, formatGameShortDate, formatGameTime } from "./format";

// 2026-11-18 18:30 UTC is 2026-11-19 02:30 in Hong Kong.
const LATE_UTC = "2026-11-18T18:30:00.000Z";

describe("game date formatting", () => {
  test("renders dates on the Hong Kong calendar day, not the UTC or local one", () => {
    expect(formatGameDate(LATE_UTC)).toBe("11/19/2026");
    expect(formatGameShortDate(LATE_UTC)).toBe("Nov 19");
  });

  test("renders times in HKT with a fixed en-US shape", () => {
    expect(formatGameTime(LATE_UTC)).toBe("02:30 AM");
    expect(formatGameDateTime(LATE_UTC)).toBe("Nov 19, 02:30 AM");
  });

  test("accepts Date objects and epoch milliseconds", () => {
    const date = new Date(LATE_UTC);
    expect(formatGameDate(date)).toBe("11/19/2026");
    expect(formatGameDate(date.getTime())).toBe("11/19/2026");
  });

  test("returns a dash for an invalid date instead of throwing", () => {
    expect(formatGameDate("not a date")).toBe("—");
  });
});
