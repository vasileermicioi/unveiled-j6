import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { EventFeedFilters } from "./EventFeedFilters";

const categoryOptions = [{ id: "theater", label: "Theater" }];
const partnerOptions = [{ id: "partner-1", label: "Volksbühne Berlin" }];

describe("EventFeedFilters collapse", () => {
  test("SSR fallback hides filter fields when no filters are applied", () => {
    const html = renderToStaticMarkup(
      <EventFeedFilters
        action="/en/events"
        categoryOptions={categoryOptions}
        locale="en"
        minDate="2026-08-30"
        partnerOptions={partnerOptions}
        query={{
          title: undefined,
          category: undefined,
          partnerId: undefined,
          from: undefined,
          to: undefined,
          page: 1,
        }}
      />,
    );

    expect(html).toContain("FILTERS");
    expect(html).toContain("All upcoming events");
    expect(html).not.toContain('id="event-feed-title"');
    expect(html).not.toContain('id="event-feed-category"');
  });

  test("SSR fallback shows filter fields when query params are applied", () => {
    const html = renderToStaticMarkup(
      <EventFeedFilters
        action="/en/events"
        categoryOptions={categoryOptions}
        locale="en"
        minDate="2026-08-30"
        partnerOptions={partnerOptions}
        query={{
          title: "Jazz",
          category: "theater",
          partnerId: undefined,
          from: "2026-09-01",
          to: "2026-09-10",
          page: 1,
        }}
      />,
    );

    expect(html).toContain('id="event-feed-title"');
    expect(html).toContain('id="event-feed-category"');
    expect(html).toContain("Jazz");
    expect(html).toContain("Range: 2026-09-01 – 2026-09-10");
  });
});
