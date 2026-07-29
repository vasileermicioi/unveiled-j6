import { describe, expect, test } from "bun:test";

import { buildTicketPreviews } from "./PdfVoucherInventoryFields";

describe("buildTicketPreviews", () => {
  test("skips pages and groups by pages-per-ticket", () => {
    const previews = buildTicketPreviews(5, 1, 2);
    expect(previews).toEqual([
      { index: 0, startPage: 2, endPage: 3, pageLabel: "p.2-3" },
      { index: 1, startPage: 4, endPage: 5, pageLabel: "p.4-5" },
    ]);
  });

  test("returns empty when split yields zero tickets", () => {
    expect(buildTicketPreviews(2, 2, 1)).toEqual([]);
    expect(buildTicketPreviews(3, 0, 4)).toEqual([]);
  });
});
