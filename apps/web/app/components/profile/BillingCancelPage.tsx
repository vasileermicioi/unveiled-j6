import { Button, Card, Form, Link, Paragraph } from "@heroui/react";

import type { BillingCopy } from "../../lib/billing-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { ProfileLayout } from "./ProfileLayout";

export type BillingCancelPageProps = {
  locale: Locale;
  copy: BillingCopy;
  error?: string | null;
};

export function BillingCancelPage({ locale, copy, error = null }: BillingCancelPageProps) {
  const billingHref = localizedPath(locale, "profile/billing");
  const action = localizedPath(locale, "profile/billing/cancel");

  return (
    <ProfileLayout
      activeTab="billing"
      eyebrow={copy.eyebrow}
      headline={copy.cancelPageTitle}
      locale={locale}
    >
      <Card className="mx-auto w-full max-w-2xl">
        <Card.Content className="flex flex-col gap-6">
          {error ? <Paragraph>{error}</Paragraph> : null}
          <Paragraph>{copy.cancelPageSubtitle}</Paragraph>

          <Form action={action} className="flex flex-col gap-4" method="post">
            <Button className="button button--primary button--md sm:max-w-xs" type="submit">
              {copy.cancelConfirm}
            </Button>
          </Form>

          <Link className="button button--secondary button--md sm:max-w-xs" href={billingHref}>
            {copy.cancelKeep}
          </Link>
        </Card.Content>
      </Card>
    </ProfileLayout>
  );
}
