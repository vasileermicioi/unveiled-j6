import { Button, Card, Form, Heading, Input, Link, Paragraph, Surface } from "@heroui/react";
import type { Subscription } from "@unveiled/db";
import { Coins, Sparkles, Ticket } from "lucide-react";

import { getBillingCopy } from "../../lib/billing-content";
import { membershipContent } from "../../lib/content/membership";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { ProfileCopy } from "../../lib/profile-content";

import { ProfileLayout } from "./ProfileLayout";

const PERK_ICONS = [Ticket, Sparkles, Coins] as const;

export type ProfilePageProps = {
  locale: Locale;
  copy: ProfileCopy;
  subscription: Subscription | null;
  error?: string | null;
};

function canOpenPortal(subscription: Subscription | null): boolean {
  if (!subscription?.stripeCustomerId) {
    return false;
  }
  const { status } = subscription;
  return status !== "INACTIVE" && status !== "UNPAID" && status !== null;
}

export function ProfilePage({ locale, copy, subscription, error = null }: ProfilePageProps) {
  const membershipHref = localizedPath(locale, "membership");
  const portalAction = localizedPath(locale, "profile");
  const perks = membershipContent[locale].perks;
  const billingCopy = getBillingCopy(locale);
  const status = subscription?.status ?? null;
  const showPortal = canOpenPortal(subscription);
  const statusLabel = status ? billingCopy.statusNames[status] : null;

  return (
    <ProfileLayout
      activeTab="membership"
      eyebrow={copy.eyebrow}
      headline={copy.title}
      locale={locale}
    >
      <Card className="membership-hero w-full">
        <Card.Content className="flex flex-col gap-8">
          <Surface className="flex flex-col gap-3" variant="transparent">
            <Heading level={2}>{copy.membershipTitle}</Heading>
            <Paragraph color="muted">{copy.membershipSubtitle}</Paragraph>
            {statusLabel ? (
              <Paragraph className="membership-hero__status">{statusLabel}</Paragraph>
            ) : null}
            {error ? <Paragraph>{error}</Paragraph> : null}
          </Surface>

          <Surface
            className="membership-hero__body grid gap-8 lg:grid-cols-2 lg:items-center"
            variant="transparent"
          >
            <Surface
              className="membership-benefits__list flex flex-col gap-4"
              variant="transparent"
            >
              {perks.map((perk, index) => {
                const Icon = PERK_ICONS[index] ?? Ticket;
                return (
                  <Surface
                    className="membership-benefits__row flex items-center gap-3"
                    key={perk}
                    variant="transparent"
                  >
                    <Surface className="membership-benefits__icon" variant="transparent">
                      <Icon aria-hidden size={20} strokeWidth={2.25} />
                    </Surface>
                    <Paragraph className="membership-benefits__text">{perk}</Paragraph>
                  </Surface>
                );
              })}
            </Surface>

            <Surface
              className="membership-hero__cta flex flex-col items-start gap-3 lg:items-center lg:justify-center"
              variant="transparent"
            >
              {showPortal ? (
                <Form action={portalAction} className="flex w-full flex-col gap-3" method="post">
                  <Input name="intent" type="hidden" value="portal" />
                  <Button className="button button--primary button--md" type="submit">
                    {copy.manageSubscriptionCta}
                  </Button>
                </Form>
              ) : (
                <Link className="button button--primary button--md" href={membershipHref}>
                  {copy.startMembershipCta}
                </Link>
              )}
            </Surface>
          </Surface>
        </Card.Content>
      </Card>
    </ProfileLayout>
  );
}
