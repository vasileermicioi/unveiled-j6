import { Link, Surface } from "@heroui/react";
import { List, Map as MapIcon } from "lucide-react";
import type { ReactNode } from "react";

import { buildEventFeedQueryString, type EventFeedQuery } from "../../lib/event-feed";
import { getEventFeedCopy } from "../../lib/event-feed-content";
import type { Locale } from "../../lib/locale";

export type EventFeedView = "list" | "map";

export type EventFeedViewTabsProps = {
  locale: Locale;
  activeView: EventFeedView;
  query: EventFeedQuery;
};

function ViewTabIcon({ view }: { view: EventFeedView }): ReactNode {
  const props = {
    "aria-hidden": true as const,
    className: "event-feed-view-tabs__icon",
    size: 16,
    strokeWidth: 2.5,
  };
  return view === "list" ? <List {...props} /> : <MapIcon {...props} />;
}

export function EventFeedViewTabs({ locale, activeView, query }: EventFeedViewTabsProps) {
  const copy = getEventFeedCopy(locale);
  const filterQuery = buildEventFeedQueryString({
    category: query.category,
    partnerId: query.partnerId,
    from: query.from,
    to: query.to,
    page: query.page,
  });

  const tabs: { id: EventFeedView; href: string; label: string }[] = [
    { id: "list", href: `/${locale}/events${filterQuery}`, label: copy.listView },
    { id: "map", href: `/${locale}/events/map${filterQuery}`, label: copy.mapView },
  ];

  return (
    <Surface
      aria-label={copy.viewTabsLabel}
      className="admin-tabs event-feed-view-tabs"
      role="tablist"
      variant="transparent"
    >
      <Surface className="admin-tabs__track" variant="transparent">
        {tabs.map((tab) => {
          const isActive = tab.id === activeView;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "link admin-tabs__tab admin-tabs__tab--active event-feed-view-tabs__tab"
                  : "link admin-tabs__tab event-feed-view-tabs__tab"
              }
              href={tab.href}
              key={tab.id}
            >
              <ViewTabIcon view={tab.id} />
              {tab.label}
            </Link>
          );
        })}
      </Surface>
    </Surface>
  );
}
