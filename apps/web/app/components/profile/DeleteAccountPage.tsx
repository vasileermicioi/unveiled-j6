import { Button, Card, Form, Link, Paragraph } from "@heroui/react";

import type { GdprMemberCopy } from "../../lib/gdpr-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { ProfileLayout } from "./ProfileLayout";

export type DeleteAccountPageProps = {
  locale: Locale;
  copy: GdprMemberCopy;
  error?: string | null;
};

export function DeleteAccountPage({ locale, copy, error = null }: DeleteAccountPageProps) {
  const profileHref = localizedPath(locale, "profile");
  const action = localizedPath(locale, "profile/delete-account");

  return (
    <ProfileLayout
      activeTab="delete-account"
      eyebrow={copy.eyebrow}
      headline={copy.deleteTitle}
      locale={locale}
    >
      <Card className="w-full">
        <Card.Content className="flex flex-col gap-6">
          {error ? <Paragraph>{error}</Paragraph> : null}
          <Paragraph>{copy.deleteSubtitle}</Paragraph>
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
    </ProfileLayout>
  );
}
