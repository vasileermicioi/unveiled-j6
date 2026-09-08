import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AppNavbar } from "./AppNavbar";
import { mockUserSession } from "./stories/fixtures";

describe("AppNavbar subscription chrome", () => {
  test("inactive USER sees membership CTA and no Explore experiences or credits", () => {
    const html = renderToStaticMarkup(
      <AppNavbar
        canBrowseEvents={false}
        locale="en"
        pathname="/en/discover"
        session={mockUserSession}
      />,
    );

    expect(html).toContain("Start membership");
    expect(html).toContain('href="/en/membership"');
    expect(html).toContain("Discover");
    expect(html).not.toContain("Explore experiences");
    expect(html).not.toContain("12 credits");
  });

  test("active USER sees Explore experiences and no membership CTA", () => {
    const html = renderToStaticMarkup(
      <AppNavbar canBrowseEvents locale="en" pathname="/en/events" session={mockUserSession} />,
    );

    expect(html).toContain("Explore experiences");
    expect(html).toContain('href="/en/events"');
    expect(html).not.toContain("Start membership");
  });
});
