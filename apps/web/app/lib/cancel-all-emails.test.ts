import { describe, test } from "bun:test";

import { sendCancelAllEmailsSafe } from "./cancel-all-emails";

describe("sendCancelAllEmailsSafe", () => {
  test("does not throw when Resend env is unset", async () => {
    await sendCancelAllEmailsSafe({
      apiKey: undefined,
      from: undefined,
      event: {
        id: "evt-1",
        title: "Night",
        address: "Berlin",
        dateTime: new Date("2030-06-01T18:00:00.000Z"),
        partnerName: "Partner",
      },
      cancelledMembers: [
        {
          bookingId: "b1",
          userId: "u1",
          email: "a@example.com",
          locale: "en",
          totalCredits: 2,
          ticketsCount: 1,
          dateTime: new Date("2030-06-01T18:00:00.000Z"),
        },
      ],
      closedWaitlistMembers: [{ userId: "u2", email: "b@example.com", locale: "de" }],
      eventTitleForLocale: () => "Night",
    });
  });
});
