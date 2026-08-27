import { describe, expect, test } from "bun:test";

import { alreadyBookedTicketsPath, getAlreadyBookedCopy } from "./booking-content";

describe("getAlreadyBookedCopy", () => {
  test("returns parent-locked DE and EN copy", () => {
    expect(getAlreadyBookedCopy("de")).toEqual({
      message: "Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen.",
      myTicketsLabel: "Meine Tickets",
    });
    expect(getAlreadyBookedCopy("en")).toEqual({
      message: "You've already booked this. You can check it in My Tickets.",
      myTicketsLabel: "My Tickets",
    });
  });

  test("My Tickets href is locale-prefixed bookings", () => {
    expect(alreadyBookedTicketsPath("de")).toBe("/de/bookings");
    expect(alreadyBookedTicketsPath("en")).toBe("/en/bookings");
  });
});
