import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { getBookPageCopy } from "../../lib/booking-content";
import { mockEvent } from "../stories/fixtures";
import { BookEventPage } from "./BookEventPage";

describe("BookEventPage already-booked", () => {
  test("shows locked copy and My Tickets without a confirm control", () => {
    const html = renderToStaticMarkup(
      <BookEventPage
        copy={getBookPageCopy("de")}
        event={mockEvent}
        idempotencyKey="story-book-key"
        locale="de"
        view="already_booked"
      />,
    );
    expect(html).toContain(
      "Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen.",
    );
    expect(html).toContain("Meine Tickets");
    expect(html).toContain("/de/bookings");
    expect(html).not.toContain("Buchung bestätigen");
    expect(html).not.toContain('method="post"');
  });
});
