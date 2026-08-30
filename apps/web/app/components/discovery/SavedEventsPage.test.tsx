import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SavedEventsPage } from "./SavedEventsPage";

describe("SavedEventsPage empty CTA", () => {
  test("inactive member is sent to membership, not browse events", () => {
    const html = renderToStaticMarkup(
      <SavedEventsPage events={[]} locale="en" subscriptionActive={false} />,
    );
    expect(html).toContain("Start membership");
    expect(html).toContain('href="/en/membership"');
    expect(html).not.toContain("Browse events");
  });

  test("active member empty state still offers browse events", () => {
    const html = renderToStaticMarkup(
      <SavedEventsPage events={[]} locale="en" subscriptionActive />,
    );
    expect(html).toContain("Browse events");
    expect(html).toContain('href="/en/events"');
    expect(html).not.toContain("Start membership");
  });
});
