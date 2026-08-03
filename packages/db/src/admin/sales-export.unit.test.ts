import { describe, expect, test } from "bun:test";
import { getBerlinCalendarDate } from "../catalog/datetime";
import {
  buildSalesExportQueryString,
  defaultSalesExportPeriod,
  formatSalesByEventCsv,
  isValidSalesExportYmd,
  parseSalesExportFilters,
  resolveSalesExportPeriod,
  type SalesByEventRow,
} from "./sales-export";

describe("sales-export period helpers", () => {
  test("isValidSalesExportYmd accepts YYYY-MM-DD only", () => {
    expect(isValidSalesExportYmd("2026-07-10")).toBe(true);
    expect(isValidSalesExportYmd("2026-7-10")).toBe(false);
    expect(isValidSalesExportYmd("10-07-2026")).toBe(false);
    expect(isValidSalesExportYmd("")).toBe(false);
  });

  test("defaultSalesExportPeriod is last 30 Berlin calendar days inclusive", () => {
    const now = new Date("2026-08-03T12:00:00.000Z");
    const { from, to } = defaultSalesExportPeriod(now);

    expect(to).toBe("2026-08-03");
    expect(from).toBe("2026-07-05");
    expect(getBerlinCalendarDate(now)).toBe("2026-08-03");
  });

  test("resolveSalesExportPeriod defaults when both omitted", () => {
    const result = resolveSalesExportPeriod({
      now: new Date("2026-08-03T12:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.usedDefault).toBe(true);
    expect(result.from).toBe("2026-07-05");
    expect(result.to).toBe("2026-08-03");
    expect(result.range.start.getTime()).toBeLessThan(result.range.end.getTime());
  });

  test("resolveSalesExportPeriod rejects invalid and inverted ranges", () => {
    expect(resolveSalesExportPeriod({ from: "bad", to: "2026-08-01" }).ok).toBe(false);
    expect(resolveSalesExportPeriod({ from: "2026-08-01", to: "" }).ok).toBe(false);

    const inverted = resolveSalesExportPeriod({ from: "2026-08-05", to: "2026-08-01" });
    expect(inverted).toEqual({
      ok: false,
      reason: "inverted",
      from: "2026-08-05",
      to: "2026-08-01",
    });
  });

  test("resolveSalesExportPeriod accepts a valid explicit range", () => {
    const result = resolveSalesExportPeriod({ from: "2026-07-01", to: "2026-07-31" });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.usedDefault).toBe(false);
    expect(result.from).toBe("2026-07-01");
    expect(result.to).toBe("2026-07-31");
  });
});

describe("formatSalesByEventCsv", () => {
  test("emits header and escaped rows", () => {
    const rows: SalesByEventRow[] = [
      {
        eventId: "11111111-1111-1111-1111-111111111111",
        title: 'Night, "Special"',
        partnerName: "Venue A",
        dateTime: new Date("2026-07-15T18:00:00.000Z"),
        ticketsSold: 3,
      },
    ];

    const csv = formatSalesByEventCsv(rows);
    expect(csv.startsWith("event_id,title,partner_name,date_time,tickets_sold\n")).toBe(true);
    expect(csv).toContain('"Night, ""Special"""');
    expect(csv).toContain("Venue A");
    expect(csv).toContain("2026-07-15T18:00:00.000Z");
    expect(csv).toContain(",3\n");
  });

  test("empty rows still include trailing newline after header", () => {
    expect(formatSalesByEventCsv([])).toBe("event_id,title,partner_name,date_time,tickets_sold\n");
  });
});

describe("sales-export filter helpers", () => {
  test("parseSalesExportFilters trims title and partner", () => {
    expect(
      parseSalesExportFilters(
        new URL("https://example.com/export?title=%20Jazz%20&partner=Club+Neuk%C3%B6lln"),
      ),
    ).toEqual({ title: "Jazz", partner: "Club Neukölln" });
    expect(parseSalesExportFilters(new URL("https://example.com/export"))).toEqual({
      title: "",
      partner: "",
    });
  });

  test("buildSalesExportQueryString omits empty filters and includes format", () => {
    expect(buildSalesExportQueryString({ from: "2026-07-01", to: "2026-07-31" })).toBe(
      "?from=2026-07-01&to=2026-07-31",
    );
    expect(
      buildSalesExportQueryString({
        from: "2026-07-01",
        to: "2026-07-31",
        title: " Jazz ",
        partner: "",
        format: "csv",
      }),
    ).toBe("?from=2026-07-01&to=2026-07-31&title=Jazz&format=csv");
  });
});
