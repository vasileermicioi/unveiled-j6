import { describe, expect, test } from "bun:test";

import { formatEventDetailWhenLines } from "./event-detail-when-display";

const CLOCK_HH_MM = /\d{2}:\d{2}/;

const morning = new Date("2026-08-15T10:00:00+02:00");
const evening = new Date("2026-08-15T19:00:00+02:00");
const laterDay = new Date("2026-08-22T19:00:00+02:00");

describe("formatEventDetailWhenLines", () => {
  test("includeTime true keeps two same-day instants as timed labels", () => {
    const lines = formatEventDetailWhenLines([morning, evening], evening, "en", {
      includeTime: true,
    });
    expect(lines).toHaveLength(2);
    expect(lines[0]?.key).toBe(morning.toISOString());
    expect(lines[1]?.key).toBe(evening.toISOString());
    expect(lines[0]?.isNext).toBe(false);
    expect(lines[1]?.isNext).toBe(true);
    expect(lines[0]?.label).toMatch(CLOCK_HH_MM);
    expect(lines[1]?.label).toMatch(CLOCK_HH_MM);
    expect(lines[0]?.label).toContain("2026");
  });

  test("includeTime false collapses same Berlin YMD and omits clock time", () => {
    const lines = formatEventDetailWhenLines([morning, evening], evening, "en", {
      includeTime: false,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.key).toBe("2026-08-15");
    expect(lines[0]?.isNext).toBe(true);
    expect(lines[0]?.label).not.toMatch(CLOCK_HH_MM);
    expect(lines[0]?.label).toContain("2026");
  });

  test("includeTime false keeps distinct Berlin days as separate lines", () => {
    const lines = formatEventDetailWhenLines([morning, evening, laterDay], evening, "de", {
      includeTime: false,
    });
    expect(lines.map((line) => line.key)).toEqual(["2026-08-15", "2026-08-22"]);
    expect(lines[0]?.isNext).toBe(true);
    expect(lines[1]?.isNext).toBe(false);
    for (const line of lines) {
      expect(line.label).not.toMatch(CLOCK_HH_MM);
    }
  });

  test("empty dateTimes falls back to nextDateTime", () => {
    const lines = formatEventDetailWhenLines([], laterDay, "en", { includeTime: true });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.key).toBe(laterDay.toISOString());
    expect(lines[0]?.isNext).toBe(true);
    expect(lines[0]?.label).toMatch(CLOCK_HH_MM);
  });
});
