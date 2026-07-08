import { describe, expect, test } from "bun:test";
import { parseSeedAdminPaginationArgs } from "./seed-pagination";
import { ADMIN_LIST_PAGE_SIZE, paginationPageCount } from "./seed-pagination-data";

describe("seed pagination helpers", () => {
  test("paginationPageCount uses admin list page size", () => {
    expect(paginationPageCount(0)).toBe(1);
    expect(paginationPageCount(25)).toBe(1);
    expect(paginationPageCount(26)).toBe(2);
    expect(paginationPageCount(30, ADMIN_LIST_PAGE_SIZE)).toBe(2);
  });

  test("parseSeedAdminPaginationArgs reads flags", () => {
    expect(parseSeedAdminPaginationArgs(["--reset", "--partners=35", "--events=40"])).toEqual({
      reset: true,
      partnerCount: 35,
      eventCount: 40,
    });
    expect(parseSeedAdminPaginationArgs(["--skip-upload"])).toEqual({
      skipUpload: true,
    });
  });

  test("parseSeedAdminPaginationArgs rejects unknown flags", () => {
    expect(() => parseSeedAdminPaginationArgs(["--page-size=5"])).toThrow(
      "Unknown argument: --page-size=5",
    );
  });
});
