import { Button, Card, Chip, Form, Heading, Input, Link, Paragraph, Surface } from "@heroui/react";
import type { Subscription } from "@unveiled/db";

import type { BillingCopy } from "../../lib/billing-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { ProfileLayout } from "./ProfileLayout";

export type BillingPageProps = {
  locale: Locale;
  copy: BillingCopy;
  subscription: Subscription | null;
  error?: string | null;
  success?: string | null;
};

function formatPeriodEnd(locale: Locale, periodEnd: Date | null | undefined): string {
  if (!periodEnd) {
    return "";
  }
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(periodEnd);
}

export function BillingPage({
  locale,
  copy,
  subscription,
  error = null,
  success = null,
}: BillingPageProps) {
  const membershipHref = localizedPath(locale, "membership");
  const cancelHref = localizedPath(locale, "profile/billing/cancel");
  const portalAction = localizedPath(locale, "profile/billing");

  const status = subscription?.status ?? null;
  const planDisplay = subscription?.plan?.trim() || copy.planName;
  const periodEndText = formatPeriodEnd(locale, subscription?.periodEnd) || copy.periodEndUnknown;
  const paymentMethod = subscription?.paymentMethod
    ? copy.paymentMethodNames[subscription.paymentMethod]
    : copy.paymentMethodUnknown;
  const billingAddress = subscription?.billingAddress?.trim() || copy.billingAddressUnknown;

  const showPortal =
    Boolean(subscription?.stripeCustomerId) &&
    status !== "UNPAID" &&
    status !== null &&
    status !== "INACTIVE";
  const showCancel = status === "ACTIVE";
  const showMembershipCta = !subscription || status === "INACTIVE";
  const showPastDue = status === "PAST_DUE";
  const showUnpaid = status === "UNPAID";
  const showCancelPending = status === "CANCELLED_PENDING";

  return (
    <ProfileLayout activeTab="billing" eyebrow={copy.eyebrow} headline={copy.title} locale={locale}>
      <Card className="mx-auto w-full max-w-2xl">
        <Card.Header className="flex flex-col gap-3">
          <Heading level={2}>{copy.planLabel}</Heading>
          {status ? (
            <Chip variant="tertiary">
              <Chip.Label>{copy.statusNames[status]}</Chip.Label>
            </Chip>
          ) : null}
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {error ? <Paragraph>{error}</Paragraph> : null}
          {success ? <Paragraph>{success}</Paragraph> : null}

          {!subscription ? (
            <Paragraph>{copy.noSubscriptionBody}</Paragraph>
          ) : (
            <>
              <Paragraph>
                {copy.planLabel}: {planDisplay}
              </Paragraph>
              <Paragraph>
                {copy.statusLabel}: {status ? copy.statusNames[status] : "—"}
              </Paragraph>
              <Paragraph>
                {copy.periodEndLabel}: {periodEndText}
              </Paragraph>
              <Paragraph>
                {copy.paymentMethodLabel}: {paymentMethod}
              </Paragraph>
              <Paragraph>
                {copy.billingAddressLabel}: {billingAddress}
              </Paragraph>
              <Paragraph color="muted">{copy.noRolloverNote}</Paragraph>
            </>
          )}

          {showPastDue ? (
            <Surface className="flex flex-col gap-2" variant="transparent">
              <Heading level={3}>{copy.pastDueTitle}</Heading>
              <Paragraph>{copy.pastDueBody}</Paragraph>
            </Surface>
          ) : null}

          {showCancelPending ? <Paragraph>{copy.cancelPendingNote}</Paragraph> : null}

          {showUnpaid ? (
            <Surface className="flex flex-col gap-2" variant="transparent">
              <Heading level={3}>{copy.unpaidTitle}</Heading>
              <Paragraph>
                {copy.unpaidBody} {copy.supportEmail}
              </Paragraph>
            </Surface>
          ) : null}

          {showMembershipCta ? (
            <Surface className="flex flex-col gap-3" variant="transparent">
              {status === "INACTIVE" ? (
                <>
                  <Heading level={3}>{copy.inactiveTitle}</Heading>
                  <Paragraph>{copy.inactiveBody}</Paragraph>
                </>
              ) : null}
              <Link className="button button--primary button--md sm:max-w-xs" href={membershipHref}>
                {copy.inactiveCta}
              </Link>
            </Surface>
          ) : null}

          {showPortal ? (
            <Form action={portalAction} className="flex flex-col gap-3" method="post">
              <Input name="intent" type="hidden" value="portal" />
              <Button className="button button--secondary button--md sm:max-w-xs" type="submit">
                {copy.portalCta}
              </Button>
            </Form>
          ) : null}

          {showCancel ? (
            <Link className="button button--secondary button--md sm:max-w-xs" href={cancelHref}>
              {copy.cancelCta}
            </Link>
          ) : null}
        </Card.Content>
      </Card>
    </ProfileLayout>
  );
}
