import { describe, expect, test } from "bun:test";

import { parsePromoCodeLines } from "./PromoCodeInventoryFields";

describe("parsePromoCodeLines", () => {
  test("one code per non-empty trimmed line", () => {
    expect(parsePromoCodeLines("A\n\n B \nA\nFOO,BAR")).toEqual(["A", "B", "FOO,BAR"]);
  });
});
