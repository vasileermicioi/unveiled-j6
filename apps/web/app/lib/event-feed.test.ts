import { describe, expect, test } from "bun:test";

import {
  buildEventFeedQueryString,
  clampEventFeedPage,
  eventFeedPageRedirectPath,
  parseEventFeedQuery,
} from "./event-feed";

describe("event-feed helpers", () => {
  test("parseEventFeedQuery defaults page to 1 and omits empty filters", () => {
    const query = parseEventFeedQuery(new URL("https://example.com/en/events"));
    expect(query).toEqual({
      category: undefined,
      partnerId: undefined,
      from: undefined,
      to: undefined,
      page: 1,
    });
  });

  test("parseEventFeedQuery reads filters and page", () => {
    const query = parseEventFeedQuery(
      new URL(
        "https://example.com/en/events?category=Theater&partnerId=abc&from=2026-07-09&to=2026-07-10&page=2",
      ),
    );
    expect(query).toEqual({
      category: "Theater",
      partnerId: "abc",
      from: "2026-07-09",
      to: "2026-07-10",
      page: 2,
    });
  });

  test("parseEventFeedQuery ignores invalid dates and non-positive pages", () => {
    const query = parseEventFeedQuery(
      new URL("https://example.com/en/events?from=09-07-2026&to=not-a-date&page=0"),
    );
    expect(query.from).toBeUndefined();
    expect(query.to).toBeUndefined();
    expect(query.page).toBe(1);
  });

  test("buildEventFeedQueryString omits page=1 and empty filters", () => {
    expect(buildEventFeedQueryString({ page: 1 })).toBe("");
    expect(
      buildEventFeedQueryString({
        category: "Theater",
        partnerId: "p1",
        from: "2026-07-09",
        to: "2026-07-12",
        page: 3,
      }),
    ).toBe("?category=Theater&partnerId=p1&from=2026-07-09&to=2026-07-12&page=3");
  });

  test("clampEventFeedPage caps to total pages with size 24", () => {
    expect(clampEventFeedPage(1, 0)).toBe(1);
    expect(clampEventFeedPage(99, 30)).toBe(2);
    expect(clampEventFeedPage(2, 48)).toBe(2);
  });

  test("eventFeedPageRedirectPath preserves filters when clamping", () => {
    const query = parseEventFeedQuery(
      new URL("https://example.com/en/events?category=Theater&page=99"),
    );
    expect(eventFeedPageRedirectPath("/en/events", query, 30)).toBe(
      "/en/events?category=Theater&page=2",
    );
    expect(
      eventFeedPageRedirectPath(
        "/en/events",
        parseEventFeedQuery(new URL("https://example.com/en/events?category=Theater&page=1")),
        30,
      ),
    ).toBeNull();
  });
});
