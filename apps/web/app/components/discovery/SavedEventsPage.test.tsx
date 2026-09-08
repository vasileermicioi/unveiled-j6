import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SavedEventsPage } from "./SavedEventsPage";

describe("SavedEventsPage empty CTA", () => {
  test("inactive member is sent to membership, not explore experiences", () => {
    const html = renderToStaticMarkup(
      <SavedEventsPage events={[]} locale="en" subscriptionActive={false} />,
    );
    expect(html).toContain("Start membership");
    expect(html).toContain('href="/en/membership"');
    expect(html).not.toContain("Explore experiences");
  });

  test("active member empty state still offers explore experiences", () => {
    const html = renderToStaticMarkup(
      <SavedEventsPage events={[]} locale="en" subscriptionActive />,
    );
    expect(html).toContain("Explore experiences");
    expect(html).toContain('href="/en/events"');
    expect(html).not.toContain("Start membership");
  });
});
