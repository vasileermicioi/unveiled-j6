import { Card, Heading, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

export type AdminMetrics = {
  partnerCount: number;
  eventCount: number;
  upcomingEventCount: number;
  remainingCapacity: number;
};

type AdminKpiGridProps = {
  locale: Locale;
  metrics: AdminMetrics;
};

type MetricItem = {
  label: string;
  value: string;
  hint?: string;
};

export function AdminKpiGrid({ locale, metrics }: AdminKpiGridProps) {
  const copy = getAdminCopy(locale);
  const numberFormatter = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB");

  const items: MetricItem[] = [
    { label: copy.kpiPartners, value: numberFormatter.format(metrics.partnerCount) },
    {
      label: copy.kpiEvents,
      value: numberFormatter.format(metrics.eventCount),
      hint: copy.kpiEventsHint(metrics.upcomingEventCount),
    },
    {
      label: copy.kpiUpcoming,
      value: numberFormatter.format(metrics.upcomingEventCount),
      hint: copy.kpiUpcomingHint(metrics.eventCount),
    },
    {
      label: copy.kpiRemainingCapacity,
      value: numberFormatter.format(metrics.remainingCapacity),
      hint: copy.kpiRemainingHint,
    },
  ];

  return (
    <Surface className="admin-metric-grid" variant="transparent">
      {items.map((item) => (
        <Card className="admin-metric-card" key={item.label}>
          <Card.Content className="admin-metric-card__content">
            <Paragraph className="admin-metric-card__label" color="muted" size="sm">
              {item.label}
            </Paragraph>
            <Heading className="admin-metric-card__value" level={2}>
              {item.value}
            </Heading>
            {item.hint ? (
              <Paragraph className="admin-metric-card__hint" color="muted" size="sm">
                {item.hint}
              </Paragraph>
            ) : null}
          </Card.Content>
        </Card>
      ))}
    </Surface>
  );
}
