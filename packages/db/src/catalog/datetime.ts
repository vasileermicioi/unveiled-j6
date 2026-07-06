import type { TimingMode } from "../schema/events";

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type DerivedDateTimeFields = {
  startTimeMinutes: number;
  weekday: number;
};

export function deriveDateTimeFields(
  dateTime: Date,
  timingMode: TimingMode,
): DerivedDateTimeFields {
  if (timingMode === "ALL_DAY") {
    const weekday = getBerlinWeekday(dateTime);
    return { startTimeMinutes: 0, weekday };
  }

  const parts = getBerlinTimeParts(dateTime);
  return {
    startTimeMinutes: parts.hour * 60 + parts.minute,
    weekday: parts.weekday,
  };
}

function getBerlinWeekday(dateTime: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(dateTime);

  const mapped = WEEKDAY_MAP[weekday];
  if (mapped === undefined) {
    throw new Error(`Unexpected Berlin weekday label: ${weekday}`);
  }

  return mapped;
}

function getBerlinTimeParts(dateTime: Date): { hour: number; minute: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(dateTime)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const weekday = WEEKDAY_MAP[parts.weekday ?? ""];
  if (weekday === undefined) {
    throw new Error(`Unexpected Berlin weekday label: ${parts.weekday}`);
  }

  return {
    hour: Number.parseInt(parts.hour ?? "0", 10),
    minute: Number.parseInt(parts.minute ?? "0", 10),
    weekday,
  };
}
