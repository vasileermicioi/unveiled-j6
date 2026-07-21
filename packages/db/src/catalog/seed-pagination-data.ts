import type { PrebuiltImageVariantsInput } from "@unveiled/images";

import type { CreateEventInput } from "./events";
import type { CreatePartnerInput } from "./partners";

/** Matches `ADMIN_LIST_PAGE_SIZE` in apps/web/app/lib/admin-content.ts */
export const ADMIN_LIST_PAGE_SIZE = 25;

export const PAGINATION_PARTNER_PREFIX = "Pagination Partner";
export const PAGINATION_EVENT_PREFIX = "Pagination Event";

export const DEFAULT_PAGINATION_PARTNER_COUNT = 30;
export const DEFAULT_PAGINATION_EVENT_COUNT = 30;

export function formatPaginationPartnerName(index: number): string {
  return `${PAGINATION_PARTNER_PREFIX} ${String(index).padStart(2, "0")}`;
}

export function formatPaginationEventTitle(index: number): string {
  return `${PAGINATION_EVENT_PREFIX} ${String(index).padStart(2, "0")}`;
}

export function buildPaginationPartnerInput(
  index: number,
  logoPrebuilt: PrebuiltImageVariantsInput,
  skipUpload?: boolean,
): CreatePartnerInput {
  const label = formatPaginationPartnerName(index);
  return {
    name: label,
    address: `Paginationstraße ${index}, 10115 Berlin`,
    contactEmail: `pagination-partner-${String(index).padStart(2, "0")}@example.test`,
    logoPrebuilt,
    skipUpload,
  };
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(19, 30, 0, 0);
  return date;
}

export function buildPaginationEventInput(
  partnerId: string,
  index: number,
  imagePrebuilt: PrebuiltImageVariantsInput,
  skipUpload?: boolean,
): CreateEventInput {
  return {
    partnerId,
    title: formatPaginationEventTitle(index),
    description: `Synthetic catalog row ${index} for admin list pagination testing.`,
    address: `Paginationstraße ${index}, 10115 Berlin`,
    neighborhood: "Mitte",
    category: "Theater",
    eventType: "Performance",
    tags: ["pagination-seed"],
    dateTime: daysFromNow((index % 30) + 1),
    creditPrice: 1,
    secretCode: `PAGE${String(index).padStart(4, "0")}`,
    imagePrebuilt,
    skipUpload,
  };
}

export function paginationPageCount(total: number, pageSize = ADMIN_LIST_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
