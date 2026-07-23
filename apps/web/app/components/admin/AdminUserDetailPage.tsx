import { Card, Chip, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { MemberDetail, UserBookingListItem } from "@unveiled/db";

import type { AdminCopy } from "../../lib/admin-content";
import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { AdminPageShell, adminUsersPath } from "./AdminPageShell";
import { adminBookingCancelPath } from "./admin-tabs";
import { memberDisplayName } from "./member-display";

type AdminUserDetailPageProps = {
  locale: Locale;
  detail: MemberDetail;
  confirmedBookings?: UserBookingListItem[];
  successMessage?: string | null;
};

type DetailRow = {
  label: string;
  value: string | null | undefined;
};

function formatList(values: string[] | null | undefined): string | null {
  if (!values || values.length === 0) {
    return null;
  }
  return values.join(", ");
}

function formatBool(value: boolean | null | undefined, copy: AdminCopy): string | null {
  if (value == null) {
    return null;
  }
  return value ? copy.optionYes : copy.optionNo;
}

function DetailRows({
  rows,
  emptyLabel,
  missingLabel,
}: {
  rows: DetailRow[];
  emptyLabel: string;
  missingLabel: string;
}) {
  const visible = rows.filter((row) => row.value != null && String(row.value).trim() !== "");

  if (visible.length === 0) {
    return <Paragraph color="muted">{emptyLabel}</Paragraph>;
  }

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      {visible.map((row) => (
        <Surface
          className="flex flex-col gap-1 sm:flex-row sm:gap-4"
          key={row.label}
          variant="transparent"
        >
          <Paragraph className="sm:min-w-48" color="muted" size="sm">
            {row.label}
          </Paragraph>
          <Paragraph>{row.value ?? missingLabel}</Paragraph>
        </Surface>
      ))}
    </Surface>
  );
}

function successCopy(copy: AdminCopy, ok: string | null | undefined): string | null {
  switch (ok) {
    case "adjust-credits":
      return copy.adjustCreditsSuccess;
    case "freeze":
      return copy.freezeSuccess;
    case "unfreeze":
      return copy.unfreezeSuccess;
    case "refund":
      return copy.refundSuccess;
    case "comp-ticket":
      return copy.compTicketSuccess;
    case "cancel-booking":
      return copy.cancelBookingSuccess;
    case "delete-account":
      return copy.deleteAccountSuccess;
    default:
      return null;
  }
}

export function AdminUserDetailPage({
  locale,
  detail,
  confirmedBookings = [],
  successMessage,
}: AdminUserDetailPageProps) {
  const copy = getAdminCopy(locale);
  const { user, subscription, counts } = detail;
  const profile = user.profile ?? {};
  const behavior = user.behavior ?? {};
  const displayName = memberDisplayName(profile, user.email);
  const userBase = `admin/users/${user.id}`;
  const flash = successMessage ?? null;

  const mutationLinks = [
    {
      href: localizedPath(locale, `${userBase}/adjust-credits`),
      label: copy.usersAdjustCredits,
    },
    {
      href: localizedPath(locale, `${userBase}/freeze`),
      label: copy.usersFreeze,
    },
    {
      href: localizedPath(locale, `${userBase}/comp-ticket`),
      label: copy.usersCompTicket,
    },
    {
      href: localizedPath(locale, `${userBase}/refund`),
      label: copy.usersRefund,
    },
    {
      href: localizedPath(locale, `${userBase}/delete-account`),
      label: copy.usersDeleteAccount,
    },
  ];

  const preferenceRows: DetailRow[] = [
    { label: copy.usersPrefInterests, value: formatList(profile.interests) },
    { label: copy.usersPrefMoods, value: formatList(profile.moods) },
    { label: copy.usersPrefDistricts, value: formatList(profile.districts) },
    { label: copy.usersPrefTiming, value: formatList(profile.timing) },
    { label: copy.usersPrefDays, value: formatList(profile.preferred_days) },
    { label: copy.usersPrefLanguages, value: formatList(profile.preferred_languages) },
    { label: copy.usersPrefAgeGroup, value: profile.age_group ?? null },
    {
      label: copy.usersPrefRadius,
      value: profile.max_distance == null ? null : `${profile.max_distance} km`,
    },
    {
      label: copy.usersPrefAccessibility,
      value: formatBool(profile.accessibility, copy),
    },
  ];

  const historyRows: DetailRow[] = [
    { label: copy.usersHistoryBookings, value: String(counts.bookings) },
    { label: copy.usersHistoryWaitlist, value: String(counts.waitlistEntries) },
    { label: copy.usersHistorySaved, value: String(counts.savedEvents) },
    {
      label: copy.usersHistorySessions,
      value: behavior.session_count == null ? null : String(behavior.session_count),
    },
  ];

  const behaviorRows: DetailRow[] = [
    {
      label: copy.usersBehaviorEventOpens,
      value: behavior.event_open_count == null ? null : String(behavior.event_open_count),
    },
    {
      label: copy.usersBehaviorFilterApplies,
      value: behavior.filter_apply_count == null ? null : String(behavior.filter_apply_count),
    },
    {
      label: copy.usersBehaviorSaves,
      value: behavior.saved_count == null ? null : String(behavior.saved_count),
    },
    {
      label: copy.usersBehaviorUnsaves,
      value: behavior.unsaved_count == null ? null : String(behavior.unsaved_count),
    },
    { label: copy.usersBehaviorLastView, value: behavior.last_view ?? null },
    { label: copy.usersBehaviorLastSeen, value: behavior.last_seen_at ?? null },
    { label: copy.usersBehaviorLastBooked, value: behavior.last_booked_event_id ?? null },
    {
      label: copy.usersBehaviorLastWaitlisted,
      value: behavior.last_waitlisted_event_id ?? null,
    },
    {
      label: copy.usersBehaviorRecentEvents,
      value: formatList(behavior.recent_event_ids),
    },
  ];

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      actions={
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          {mutationLinks.map((action) => (
            <Link
              className="button button--secondary button--md"
              href={action.href}
              key={action.href}
            >
              {action.label}
            </Link>
          ))}
        </Surface>
      }
      breadcrumbs={[
        { label: copy.usersTitle, href: adminUsersPath(locale) },
        { label: displayName },
      ]}
      subtitle={user.email}
      title={displayName}
      wrapInCard={false}
    >
      {flash ? <Paragraph className="admin-flash admin-flash--success">{flash}</Paragraph> : null}

      <Card className="w-full">
        <Card.Header>
          <Heading level={2}>{copy.usersSectionSummary}</Heading>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Surface className="flex flex-wrap gap-2" variant="transparent">
            <Chip variant="tertiary">
              <Chip.Label>{user.role}</Chip.Label>
            </Chip>
            <Chip variant="tertiary">
              <Chip.Label>
                {copy.usersColCredits}: {user.credits}
              </Chip.Label>
            </Chip>
            <Chip variant="tertiary">
              <Chip.Label>
                {copy.usersColSubscription}: {subscription?.status ?? copy.usersNoValue}
              </Chip.Label>
            </Chip>
            {subscription?.plan ? (
              <Chip variant="tertiary">
                <Chip.Label>{subscription.plan}</Chip.Label>
              </Chip>
            ) : null}
          </Surface>
        </Card.Content>
      </Card>

      <Card className="w-full">
        <Card.Header>
          <Heading level={2}>{copy.usersSectionBookings}</Heading>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {confirmedBookings.length === 0 ? (
            <Paragraph color="muted">{copy.usersEmptyBookings}</Paragraph>
          ) : (
            confirmedBookings.map((item) => (
              <Surface
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                key={item.booking.id}
                variant="transparent"
              >
                <Surface className="flex flex-col gap-1" variant="transparent">
                  <Paragraph>{item.event.title}</Paragraph>
                  <Paragraph color="muted" size="sm">
                    {item.booking.ticketsCount} · {item.booking.status}
                  </Paragraph>
                </Surface>
                <Link
                  className="button button--secondary button--md"
                  href={adminBookingCancelPath(locale, item.booking.id)}
                >
                  {copy.usersCancelBooking}
                </Link>
              </Surface>
            ))
          )}
        </Card.Content>
      </Card>

      <Card className="w-full">
        <Card.Header>
          <Heading level={2}>{copy.usersSectionPreferences}</Heading>
        </Card.Header>
        <Card.Content>
          <DetailRows
            emptyLabel={copy.usersEmptyPreferences}
            missingLabel={copy.usersNoValue}
            rows={preferenceRows}
          />
        </Card.Content>
      </Card>

      <Card className="w-full">
        <Card.Header>
          <Heading level={2}>{copy.usersSectionHistory}</Heading>
        </Card.Header>
        <Card.Content>
          <DetailRows
            emptyLabel={copy.usersNoValue}
            missingLabel={copy.usersNoValue}
            rows={historyRows}
          />
        </Card.Content>
      </Card>

      <Card className="w-full">
        <Card.Header>
          <Heading level={2}>{copy.usersSectionBehavior}</Heading>
        </Card.Header>
        <Card.Content>
          <DetailRows
            emptyLabel={copy.usersEmptyBehavior}
            missingLabel={copy.usersNoValue}
            rows={behaviorRows}
          />
        </Card.Content>
      </Card>
    </AdminPageShell>
  );
}

export { successCopy };
