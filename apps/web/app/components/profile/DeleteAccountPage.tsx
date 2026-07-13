import { Button, Card, Form, Heading, Link, Paragraph, Surface } from "@heroui/react";

import type { GdprMemberCopy } from "../../lib/gdpr-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type DeleteAccountPageProps = {
  locale: Locale;
  copy: GdprMemberCopy;
  error?: string | null;
};

export function DeleteAccountPage({ locale, copy, error = null }: DeleteAccountPageProps) {
  const profileHref = localizedPath(locale, "profile");
  const action = localizedPath(locale, "profile/delete-account");

  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:py-14"
      variant="transparent"
    >
      <Surface className="flex max-w-2xl flex-col gap-3" variant="transparent">
        <Heading level={1}>{copy.deleteTitle}</Heading>
        <Paragraph color="muted">{copy.deleteSubtitle}</Paragraph>
        <Link href={profileHref}>{copy.deleteBack}</Link>
      </Surface>

      <Card className="mx-auto w-full max-w-2xl">
        <Card.Content className="flex flex-col gap-6">
          {error ? <Paragraph>{error}</Paragraph> : null}
          <Paragraph>{copy.deleteWarning}</Paragraph>

          <Form action={action} className="flex flex-col gap-4" method="post">
            <Button className="button button--primary button--md sm:max-w-xs" type="submit">
              {copy.deleteConfirm}
            </Button>
          </Form>

          <Link className="button button--secondary button--md sm:max-w-xs" href={profileHref}>
            {copy.deleteKeep}
          </Link>
        </Card.Content>
      </Card>
    </Surface>
  );
}
