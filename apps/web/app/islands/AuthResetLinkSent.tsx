import { Card, Description, Link, Paragraph } from "@heroui/react";

import { AuthFormFallback } from "../components/AuthFormFallback";
import { getAuthLocalization } from "../lib/auth-localization";
import type { Locale } from "../lib/locale";
import { useClientMounted } from "./useClientMounted";

/** Must match `@better-auth-ui/heroui` ForgotPassword sessionStorage key. */
const RESET_LINK_SENT_STORAGE_KEY = "better-auth-ui.reset-link-sent";

type AuthResetLinkSentProps = {
  locale: Locale;
};

export default function AuthResetLinkSent({ locale }: AuthResetLinkSentProps) {
  const mounted = useClientMounted();

  if (!mounted) {
    return <AuthFormFallback locale={locale} />;
  }

  const copy = getAuthLocalization(locale).auth;
  const email = sessionStorage.getItem(RESET_LINK_SENT_STORAGE_KEY)?.trim() ?? "";
  const message = email
    ? copy.resetLinkSentTo.replace("{{email}}", email)
    : copy.passwordResetEmailSent;

  return (
    <Card className="auth-form" variant="default">
      <Card.Content>
        <Paragraph className="auth-form__confirm-message">{message}</Paragraph>
      </Card.Content>
      <Card.Footer>
        <Description>
          {copy.rememberYourPassword} <Link href={`/${locale}/login`}>{copy.signIn}</Link>
        </Description>
      </Card.Footer>
    </Card>
  );
}
