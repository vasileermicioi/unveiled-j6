import { describe, expect, test } from "bun:test";
import { CatalogValidationError } from "@unveiled/db";

import { mapCatalogErrorCode } from "./admin-content";
import {
  adminListPageRedirectPath,
  buildAdminListQueryString,
  clampAdminListPage,
  mapCatalogError,
  parseAdminListQuery,
} from "./admin-route";

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

  test("clampAdminListPage caps page to total pages", () => {
    expect(clampAdminListPage(1, 0, 25)).toBe(1);
    expect(clampAdminListPage(99, 30, 25)).toBe(2);
    expect(clampAdminListPage(2, 30, 25)).toBe(2);
  });

  test("adminListPageRedirectPath preserves q when clamping page", () => {
    const listQuery = parseAdminListQuery(
      new URL("https://example.com/de/admin/partners?q=berghain&page=99"),
    );

    expect(adminListPageRedirectPath("/de/admin/partners", listQuery, 30)).toBe(
      "/de/admin/partners?q=berghain&page=2",
    );

    const inRangeQuery = parseAdminListQuery(
      new URL("https://example.com/de/admin/partners?q=berghain&page=2"),
    );
    expect(adminListPageRedirectPath("/de/admin/partners", inRangeQuery, 30)).toBeNull();
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

  test("mapCatalogError maps image validation and storage errors", async () => {
    const { ImageValidationError } = await import("@unveiled/images");

    expect(
      mapCatalogError(new ImageValidationError("Image must be JPEG, PNG, or WebP"), "en"),
    ).toContain("JPEG");
    expect(
      mapCatalogError(new Error("S3_ENDPOINT, S3_REGION, S3_BUCKET are required"), "en"),
    ).toContain("not configured");
  });
});
