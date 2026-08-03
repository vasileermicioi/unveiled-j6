import { describe, expect, test } from "bun:test";
import { CatalogValidationError } from "@unveiled/db";

import { mapCatalogErrorCode } from "./admin-content";
import {
  adminListPageRedirectPath,
  buildAdminListQueryString,
  clampAdminListPage,
  mapCatalogError,
  parseAdminEventsListQuery,
  parseAdminListQuery,
  parseAdminPartnersListQuery,
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

  test("parseAdminPartnersListQuery defaults to omit sort", () => {
    const query = parseAdminPartnersListQuery(new URL("https://example.com/de/admin/partners"));
    expect(query.sort).toBeUndefined();
    expect(query.dir).toBeUndefined();
  });

  test("parseAdminPartnersListQuery treats created+desc as domain default", () => {
    const query = parseAdminPartnersListQuery(
      new URL("https://example.com/de/admin/partners?sort=created&dir=desc"),
    );
    expect(query.sort).toBeUndefined();
    expect(query.dir).toBeUndefined();
  });

  test("parseAdminPartnersListQuery reads explicit sort and dir", () => {
    const query = parseAdminPartnersListQuery(
      new URL("https://example.com/de/admin/partners?q=haus&sort=name&dir=asc&page=2"),
    );
    expect(query.q).toBe("haus");
    expect(query.page).toBe(2);
    expect(query.sort).toBe("name");
    expect(query.dir).toBe("asc");
  });

  test("parseAdminPartnersListQuery ignores invalid or incomplete sort params", () => {
    expect(
      parseAdminPartnersListQuery(
        new URL("https://example.com/de/admin/partners?sort=bogus&dir=asc"),
      ).sort,
    ).toBeUndefined();
    expect(
      parseAdminPartnersListQuery(new URL("https://example.com/de/admin/partners?sort=name")).sort,
    ).toBeUndefined();
    expect(
      parseAdminPartnersListQuery(new URL("https://example.com/de/admin/partners?dir=asc")).dir,
    ).toBeUndefined();
  });

  test("parseAdminEventsListQuery defaults to omit sort", () => {
    const query = parseAdminEventsListQuery(new URL("https://example.com/de/admin/events"));
    expect(query.sort).toBeUndefined();
    expect(query.dir).toBeUndefined();
    expect(query.title).toBe("");
    expect(query.partner).toBe("");
    expect(query.language).toBe("");
  });

  test("parseAdminEventsListQuery treats created+desc as domain default", () => {
    const query = parseAdminEventsListQuery(
      new URL("https://example.com/de/admin/events?sort=created&dir=desc"),
    );
    expect(query.sort).toBeUndefined();
    expect(query.dir).toBeUndefined();
  });

  test("parseAdminEventsListQuery reads explicit sort, filters, and dir", () => {
    const query = parseAdminEventsListQuery(
      new URL(
        "https://example.com/de/admin/events?title=opera&partner=haus&language=en&sort=title&dir=asc&page=2",
      ),
    );
    expect(query.title).toBe("opera");
    expect(query.partner).toBe("haus");
    expect(query.language).toBe("EN");
    expect(query.page).toBe(2);
    expect(query.sort).toBe("title");
    expect(query.dir).toBe("asc");
  });

  test("parseAdminEventsListQuery ignores invalid or incomplete sort params", () => {
    expect(
      parseAdminEventsListQuery(new URL("https://example.com/de/admin/events?sort=bogus&dir=asc"))
        .sort,
    ).toBeUndefined();
    expect(
      parseAdminEventsListQuery(new URL("https://example.com/de/admin/events?sort=title")).sort,
    ).toBeUndefined();
    expect(
      parseAdminEventsListQuery(new URL("https://example.com/de/admin/events?dir=asc")).dir,
    ).toBeUndefined();
    expect(
      parseAdminEventsListQuery(new URL("https://example.com/de/admin/events?language=english"))
        .language,
    ).toBe("");
  });

  test("buildAdminListQueryString preserves active filters", () => {
    expect(buildAdminListQueryString({ q: "demo", page: 3 })).toBe("?q=demo&page=3");
    expect(buildAdminListQueryString({ q: "demo" })).toBe("?q=demo");
  });

  test("buildAdminListQueryString preserves partner sort and omits default", () => {
    expect(buildAdminListQueryString({ q: "haus", sort: "name", dir: "asc", page: 2 })).toBe(
      "?q=haus&sort=name&dir=asc&page=2",
    );
    expect(buildAdminListQueryString({ sort: "events", dir: "desc" })).toBe(
      "?sort=events&dir=desc",
    );
    expect(buildAdminListQueryString({ sort: "created", dir: "desc", q: "x" })).toBe("?q=x");
    expect(buildAdminListQueryString({ sort: "created", dir: "asc" })).toBe(
      "?sort=created&dir=asc",
    );
  });

  test("buildAdminListQueryString preserves event filters and sort", () => {
    expect(
      buildAdminListQueryString({
        title: "opera",
        partner: "haus",
        language: "EN",
        sort: "title",
        dir: "asc",
      }),
    ).toBe("?title=opera&partner=haus&language=EN&sort=title&dir=asc");
    expect(buildAdminListQueryString({ sort: "date", dir: "desc" })).toBe("?sort=date&dir=desc");
    expect(buildAdminListQueryString({ sort: "capacity", dir: "asc" })).toBe(
      "?sort=capacity&dir=asc",
    );
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

  test("adminListPageRedirectPath preserves partner sort when clamping page", () => {
    const listQuery = parseAdminPartnersListQuery(
      new URL("https://example.com/de/admin/partners?sort=events&dir=asc&page=99"),
    );

    expect(adminListPageRedirectPath("/de/admin/partners", listQuery, 30)).toBe(
      "/de/admin/partners?sort=events&dir=asc&page=2",
    );
  });

  test("mapCatalogError maps validation codes to admin copy", () => {
    expect(mapCatalogError(new CatalogValidationError("INVALID_EMAIL", "bad"), "en")).toContain(
      "valid email",
    );
    expect(
      mapCatalogError(new CatalogValidationError("REQUIRED_FIELD", "name is required"), "en"),
    ).toContain("Name is required");
    expect(mapCatalogErrorCode("de", "PARTNER_HAS_EVENTS")).toContain("Events");
    expect(
      mapCatalogError(
        new CatalogValidationError("MISSING_EVENT_IMAGE", "Partner logo image is required"),
        "en",
      ),
    ).toContain("Partner logo");
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
