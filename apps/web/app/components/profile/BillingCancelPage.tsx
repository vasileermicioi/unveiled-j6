import { Button, Card, Form, Heading, Link, Paragraph, Surface } from "@heroui/react";

import type { BillingCopy } from "../../lib/billing-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type BillingCancelPageProps = {
  locale: Locale;
  copy: BillingCopy;
  error?: string | null;
};

export function BillingCancelPage({ locale, copy, error = null }: BillingCancelPageProps) {
  const billingHref = localizedPath(locale, "profile/billing");
  const action = localizedPath(locale, "profile/billing/cancel");

  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:py-14"
      variant="transparent"
    >
      <Surface className="flex max-w-2xl flex-col gap-3" variant="transparent">
        <Heading level={1}>{copy.cancelPageTitle}</Heading>
        <Paragraph color="muted">{copy.cancelPageSubtitle}</Paragraph>
        <Link href={billingHref}>{copy.backToBilling}</Link>
      </Surface>

      <Card className="mx-auto w-full max-w-2xl">
        <Card.Content className="flex flex-col gap-6">
          {error ? <Paragraph>{error}</Paragraph> : null}

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
    </Surface>
  );
}
