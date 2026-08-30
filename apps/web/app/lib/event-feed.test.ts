import { describe, expect, test } from "bun:test";

import {
  buildEventFeedQueryString,
  clampEventFeedPage,
  eventFeedHasActiveFilters,
  eventFeedPageRedirectPath,
  parseEventFeedQuery,
} from "./event-feed";

describe("event-feed helpers", () => {
  test("parseEventFeedQuery defaults page to 1 and omits empty filters", () => {
    const query = parseEventFeedQuery(new URL("https://example.com/en/events"));
    expect(query).toEqual({
      title: undefined,
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
        "https://example.com/en/events?title=Jazz&category=Theater&partnerId=abc&from=2026-07-09&to=2026-07-10&page=2",
      ),
    );
    expect(query).toEqual({
      title: "Jazz",
      category: "theater",
      partnerId: "abc",
      from: "2026-07-09",
      to: "2026-07-10",
      page: 2,
    });
  });

  test("parseEventFeedQuery aliases legacy INTERESTS category ids", () => {
    const aliases: Array<[string, string]> = [
      ["Theater", "theater"],
      ["Kino", "cinema"],
      ["Museum", "museum"],
      ["Ausstellung", "exhibition_hall"],
      ["Konzert", "live_music_venue"],
      ["Talk/Lesung", "literature_house"],
      ["Comedy", "comedy_club"],
      ["Tanz/Performance", "dance_venue"],
      ["Other", "cultural_center"],
    ];
    for (const [legacy, key] of aliases) {
      const url = new URL("https://example.com/en/events");
      url.searchParams.set("category", legacy);
      expect(parseEventFeedQuery(url).category).toBe(key);
    }
  });

  test("parseEventFeedQuery leaves allowlisted keys and unknown values unchanged", () => {
    expect(
      parseEventFeedQuery(new URL("https://example.com/en/events?category=theater")).category,
    ).toBe("theater");
    expect(
      parseEventFeedQuery(new URL("https://example.com/en/events?category=NotARealCategory"))
        .category,
    ).toBe("NotARealCategory");
    expect(
      parseEventFeedQuery(new URL("https://example.com/en/events?category=THEATER")).category,
    ).toBe("THEATER");
  });

  test("parseEventFeedQuery trims title and omits whitespace-only title", () => {
    expect(
      parseEventFeedQuery(new URL("https://example.com/en/events?title=%20Jazz%20Night%20")).title,
    ).toBe("Jazz Night");
    expect(
      parseEventFeedQuery(new URL("https://example.com/en/events?title=%20%20")).title,
    ).toBeUndefined();
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
    expect(buildEventFeedQueryString({ title: "  " })).toBe("");
    expect(
      buildEventFeedQueryString({
        title: "Jazz",
        category: "Theater",
        partnerId: "p1",
        from: "2026-07-09",
        to: "2026-07-12",
        page: 3,
      }),
    ).toBe("?title=Jazz&category=Theater&partnerId=p1&from=2026-07-09&to=2026-07-12&page=3");
  });

  test("eventFeedHasActiveFilters is false only when no filter params are set", () => {
    expect(
      eventFeedHasActiveFilters({
        title: undefined,
        category: undefined,
        partnerId: undefined,
        from: undefined,
        to: undefined,
        page: 2,
      }),
    ).toBe(false);
    expect(
      eventFeedHasActiveFilters({
        title: "Jazz",
        category: undefined,
        partnerId: undefined,
        from: undefined,
        to: undefined,
        page: 1,
      }),
    ).toBe(true);
  });

  test("clampEventFeedPage caps to total pages with size 24", () => {
    expect(clampEventFeedPage(1, 0)).toBe(1);
    expect(clampEventFeedPage(99, 30)).toBe(2);
    expect(clampEventFeedPage(2, 48)).toBe(2);
  });

  test("eventFeedPageRedirectPath preserves filters when clamping", () => {
    const query = parseEventFeedQuery(
      new URL("https://example.com/en/events?title=Jazz&category=Theater&page=99"),
    );
    expect(eventFeedPageRedirectPath("/en/events", query, 30)).toBe(
      "/en/events?title=Jazz&category=theater&page=2",
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
