import { describe, expect, test } from "bun:test";

import {
  buildTicketPreviews,
  formatPageLabel,
  parseSkipPageSpec,
} from "./PdfVoucherInventoryFields";

describe("parseSkipPageSpec", () => {
  test("parses comma-separated pages and ranges", () => {
    const parsed = parseSkipPageSpec("1-3,7,9-10");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect([...parsed.pages].sort((a, b) => a - b)).toEqual([1, 2, 3, 7, 9, 10]);
  });

  test("treats empty as no skips", () => {
    const parsed = parseSkipPageSpec("  ");
    expect(parsed).toEqual({ ok: true, pages: new Set() });
  });

  test("rejects invalid tokens and inverted ranges", () => {
    expect(parseSkipPageSpec("1,,2").ok).toBe(false);
    expect(parseSkipPageSpec("a").ok).toBe(false);
    expect(parseSkipPageSpec("5-2").ok).toBe(false);
    expect(parseSkipPageSpec("0").ok).toBe(false);
  });
});

describe("formatPageLabel", () => {
  test("collapses contiguous runs", () => {
    expect(formatPageLabel([4, 5, 6, 8])).toBe("p.4-6,8");
    expect(formatPageLabel([2])).toBe("p.2");
  });
});

describe("buildTicketPreviews", () => {
  test("skips listed pages and groups by pages-per-ticket", () => {
    const previews = buildTicketPreviews(10, new Set([1, 2, 3, 7, 9, 10]), 1);
    expect(previews.map((preview) => preview.pages)).toEqual([[4], [5], [6], [8]]);
    expect(previews.map((preview) => preview.pageLabel)).toEqual(["p.4", "p.5", "p.6", "p.8"]);
  });

  test("groups remaining pages by pages-per-ticket", () => {
    const previews = buildTicketPreviews(5, new Set([1]), 2);
    expect(previews).toEqual([
      { index: 0, pages: [2, 3], pageLabel: "p.2-3" },
      { index: 1, pages: [4, 5], pageLabel: "p.4-5" },
    ]);
  });

  test("returns empty when split yields zero tickets", () => {
    expect(buildTicketPreviews(2, new Set([1, 2]), 1)).toEqual([]);
    expect(buildTicketPreviews(3, new Set(), 4)).toEqual([]);
  });
});
