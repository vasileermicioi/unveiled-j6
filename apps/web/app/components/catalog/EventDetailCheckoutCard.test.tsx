import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import EventDetailCheckoutCard from "../../islands/EventDetailCheckoutCard";

const morning = "2030-09-01T08:00:00.000Z";
const evening = "2030-09-01T17:00:00.000Z";

describe("EventDetailCheckoutCard already-booked overlay", () => {
  test("replaces book CTA with locked copy and My Tickets for the selected hour", () => {
    const html = renderToStaticMarkup(
      <EventDetailCheckoutCard
        alreadyBookedMessage="Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen."
        bookedOccurrenceIsos={[morning]}
        creditPrice={1}
        datetimeLabel="Datum und Uhrzeit"
        defaultDateTimeIso={morning}
        locale="de"
        myTicketsHref="/de/bookings"
        myTicketsLabel="Meine Tickets"
        noticeText="Eligible notice"
        occurrences={[
          { startsAtIso: morning, creditPrice: 1, maxQty: 1 },
          { startsAtIso: evening, creditPrice: 4, maxQty: 1 },
        ]}
        policyText="SECURE RSVP // NO REFUNDS"
        primaryAction={{ type: "book", bookPath: "/de/events/x/book", label: "Buchen" }}
        showCreditTotal
        showTicketControls
        totalLabel="Total"
      />,
    );
    expect(html).toContain(
      "Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen.",
    );
    expect(html).toContain("Meine Tickets");
    expect(html).toContain("/de/bookings");
    expect(html).toContain("Datum und Uhrzeit");
    expect(html).not.toContain("Buchen");
    expect(html).not.toContain("Eligible notice");
  });
});
