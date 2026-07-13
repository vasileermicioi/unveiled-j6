import {
  Button,
  Card,
  Chip,
  Form,
  Heading,
  Input,
  Label,
  Link,
  Paragraph,
  Surface,
  TextField,
} from "@heroui/react";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { ProfileCopy } from "../../lib/profile-content";

export type ProfilePageProps = {
  locale: Locale;
  copy: ProfileCopy;
  credits: number;
  firstName: string;
  lastName: string;
  email: string;
  error?: string | null;
  success?: string | null;
};

export function ProfilePage({
  locale,
  copy,
  credits,
  firstName,
  lastName,
  email,
  error = null,
  success = null,
}: ProfilePageProps) {
  const preferencesHref = localizedPath(locale, "profile/preferences");
  const billingHref = localizedPath(locale, "profile/billing");
  const securityHref = localizedPath(locale, "profile/security");
  const membershipHref = localizedPath(locale, "membership");
  const dataExportHref = localizedPath(locale, "profile/data-export");
  const deleteAccountHref = localizedPath(locale, "profile/delete-account");
  const action = localizedPath(locale, "profile");

  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:py-14"
      variant="transparent"
    >
      <Surface className="flex max-w-2xl flex-col gap-3" variant="transparent">
        <Heading level={1}>{copy.title}</Heading>
        <Paragraph color="muted">{copy.subtitle}</Paragraph>
      </Surface>

      <Card className="mx-auto w-full max-w-2xl">
        <Card.Header className="flex flex-col gap-4">
          <Heading level={2}>{copy.walletTitle}</Heading>
          <Chip variant="tertiary">
            <Chip.Label>{copy.walletBalance(credits)}</Chip.Label>
          </Chip>
          <Link className="button button--primary button--md sm:max-w-xs" href={membershipHref}>
            {copy.refillCta}
          </Link>
        </Card.Header>
      </Card>

      <Card className="mx-auto w-full max-w-2xl">
        <Card.Header>
          <Heading level={2}>{copy.identityTitle}</Heading>
        </Card.Header>
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

      <Card className="mx-auto w-full max-w-2xl">
        <Card.Header>
          <Heading level={2}>{copy.linksTitle}</Heading>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          <Link className="button button--secondary button--md" href={preferencesHref}>
            {copy.preferencesLink}
          </Link>
          <Link className="button button--secondary button--md" href={billingHref}>
            {copy.billingLink}
          </Link>
          <Link className="button button--secondary button--md" href={securityHref}>
            {copy.passwordLink}
          </Link>
          <Link className="button button--secondary button--md" href={dataExportHref}>
            {copy.dataExportLink}
          </Link>
          <Link className="button button--secondary button--md" href={deleteAccountHref}>
            {copy.deleteAccountLink}
          </Link>
        </Card.Content>
      </Card>
    </Surface>
  );
}
