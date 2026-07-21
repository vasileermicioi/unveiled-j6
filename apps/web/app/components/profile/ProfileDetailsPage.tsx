import { Button, Card, Form, Input, Label, Paragraph, TextField } from "@heroui/react";

import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { ProfileCopy } from "../../lib/profile-content";

import { ProfileLayout } from "./ProfileLayout";

export type ProfileDetailsPageProps = {
  locale: Locale;
  copy: ProfileCopy;
  firstName: string;
  lastName: string;
  email: string;
  error?: string | null;
  success?: string | null;
};

export function ProfileDetailsPage({
  locale,
  copy,
  firstName,
  lastName,
  email,
  error = null,
  success = null,
}: ProfileDetailsPageProps) {
  const action = localizedPath(locale, "profile/details");

  return (
    <ProfileLayout
      activeTab="details"
      eyebrow={copy.eyebrow}
      headline={copy.identityTitle}
      locale={locale}
    >
      <Card className="mx-auto w-full max-w-2xl">
        <Card.Content className="flex flex-col gap-6">
          {error ? <Paragraph>{error}</Paragraph> : null}
          {success ? <Paragraph>{success}</Paragraph> : null}

          <Form action={action} className="flex flex-col gap-6" method="post">
            <TextField defaultValue={firstName} fullWidth isRequired name="first_name">
              <Label>{copy.firstNameLabel}</Label>
              <Input />
            </TextField>

            <TextField defaultValue={lastName} fullWidth isRequired name="last_name">
              <Label>{copy.lastNameLabel}</Label>
              <Input />
            </TextField>

            <TextField defaultValue={email} fullWidth isRequired name="email">
              <Label>{copy.emailLabel}</Label>
              <Input type="email" />
            </TextField>

            <Button className="button button--primary button--md sm:max-w-xs" type="submit">
              {copy.saveIdentity}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </ProfileLayout>
  );
}
