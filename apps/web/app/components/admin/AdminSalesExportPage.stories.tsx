import type { Story } from "@ladle/react";
import type { SalesByEventRow } from "@unveiled/db";

import { storyLocale } from "../stories/fixtures";
import { AdminSalesExportPage } from "./AdminSalesExportPage";

const sampleRows: SalesByEventRow[] = [
  {
    eventId: "11111111-1111-1111-1111-111111111111",
    title: "Midnight Jazz",
    partnerName: "Club Neukölln",
    dateTime: new Date("2026-08-10T18:00:00.000Z"),
    ticketsSold: 12,
  },
  {
    eventId: "22222222-2222-2222-2222-222222222222",
    title: "Gallery Opening",
    partnerName: "Atelier Mitte",
    dateTime: new Date("2026-08-12T16:00:00.000Z"),
    ticketsSold: 0,
  },
];

export const Default: Story = () => (
  <AdminSalesExportPage from="2026-07-05" locale={storyLocale} rows={sampleRows} to="2026-08-03" />
);
Default.storyName = "AdminSalesExportPage / Default";

export const PeriodError: Story = () => (
  <AdminSalesExportPage
    from="2026-08-05"
    locale={storyLocale}
    periodError
    rows={[]}
    to="2026-08-01"
  />
);
PeriodError.storyName = "AdminSalesExportPage / Period error";
