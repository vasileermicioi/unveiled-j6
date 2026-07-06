import { describe, expect, test } from "bun:test";
import { CatalogValidationError } from "@unveiled/db";

import { mapCatalogErrorCode } from "./admin-content";
import { buildAdminListQueryString, mapCatalogError, parseAdminListQuery } from "./admin-route";

describe("admin-route helpers", () => {
  test("parseAdminListQuery defaults page to 1", () => {
    const query = parseAdminListQuery(new URL("https://example.com/de/admin/partners"));
    expect(query.page).toBe(1);
    expect(query.offset).toBe(0);
    expect(query.q).toBe("");
  });

  test("parseAdminListQuery reads search and page", () => {
    const query = parseAdminListQuery(
      new URL("https://example.com/de/admin/partners?q=berghain&page=2"),
    );
    expect(query.q).toBe("berghain");
    expect(query.page).toBe(2);
    expect(query.offset).toBe(25);
  });

  test("buildAdminListQueryString preserves active filters", () => {
    expect(buildAdminListQueryString({ q: "demo", page: 3 })).toBe("?q=demo&page=3");
    expect(buildAdminListQueryString({ q: "demo" })).toBe("?q=demo");
  });

  test("mapCatalogError maps validation codes to admin copy", () => {
    expect(mapCatalogError(new CatalogValidationError("INVALID_EMAIL", "bad"), "en")).toContain(
      "valid email",
    );
    expect(
      mapCatalogError(new CatalogValidationError("REQUIRED_FIELD", "name is required"), "en"),
    ).toContain("Name is required");
    expect(mapCatalogErrorCode("de", "PARTNER_HAS_EVENTS")).toContain("Events");
  });
});
