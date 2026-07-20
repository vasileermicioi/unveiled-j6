import { Alert, Card, Link, Surface } from "@heroui/react";
import type { ReactNode } from "react";

import {
  buildEventFeedQueryString,
  type EventFeedQuery,
  MEMBER_FEED_PAGE_SIZE,
} from "../../lib/event-feed";
import { getEventFeedCopy } from "../../lib/event-feed-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { AdminFormSelectOption } from "../admin/AdminFormSelect";
import { PageSectionHeader } from "../marketing/PageSectionHeader";

import { EventFeedFilters } from "./EventFeedFilters";
import { EventFeedPagination } from "./EventFeedPagination";
import { EventFeedViewTabs, type EventFeedView } from "./EventFeedViewTabs";

/** Hide top+bottom pagination chrome when the result set fits on one short screen. */
const PAGINATION_MIN_TOTAL = 7;

export type EventDiscoveryShellProps = {
  locale: Locale;
  view: EventFeedView;
  query: EventFeedQuery;
  total: number;
  categoryOptions: AdminFormSelectOption[];
  partnerOptions: AdminFormSelectOption[];
  /** Membership gate alert — list view only. */
  subscriptionActive?: boolean;
  children: ReactNode;
};

export function EventDiscoveryShell({
  locale,
  view,
  query,
  total,
  categoryOptions,
  partnerOptions,
  subscriptionActive,
  children,
}: EventDiscoveryShellProps) {
  const copy = getEventFeedCopy(locale);
  const basePath = view === "map" ? `/${locale}/events/map` : `/${locale}/events`;
  const queryString = buildEventFeedQueryString({
    category: query.category,
    partnerId: query.partnerId,
    from: query.from,
    to: query.to,
    page: query.page,
  });
  // List: top+bottom when many results. Map: top only, always (no ≤6 hide).
  const showTopPagination = view === "map" || total >= PAGINATION_MIN_TOTAL;
  const showBottomPagination = view === "list" && total >= PAGINATION_MIN_TOTAL;

  const paginationProps = {
    basePath,
    locale,
    page: query.page,
    pageSize: MEMBER_FEED_PAGE_SIZE,
    queryString,
    total,
  } as const;

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        variant="transparent"
      >
        <PageSectionHeader
          className="min-w-0 flex-1"
          eyebrow={copy.eyebrow}
          headline={copy.title}
        />
        <EventFeedViewTabs activeView={view} locale={locale} query={query} />
      </Surface>

      {subscriptionActive === false ? (
        <Alert status="warning">
          <Alert.Content>
            <Alert.Title>{copy.subscriptionGateTitle}</Alert.Title>
            <Alert.Description>{copy.subscriptionGateBody}</Alert.Description>
          </Alert.Content>
          <Link
            className="button button--primary button--md"
            href={localizedPath(locale, "membership")}
          >
            {copy.subscriptionGateCta}
          </Link>
        </Alert>
      ) : null}

      <Card>
        <Card.Content className="py-4">
          <EventFeedFilters
            action={basePath}
            categoryOptions={categoryOptions}
            locale={locale}
            partnerOptions={partnerOptions}
            query={query}
          />
        </Card.Content>
      </Card>

      {showTopPagination ? <EventFeedPagination {...paginationProps} /> : null}
      {children}
      {showBottomPagination ? <EventFeedPagination {...paginationProps} /> : null}
    </Surface>
  );
}
