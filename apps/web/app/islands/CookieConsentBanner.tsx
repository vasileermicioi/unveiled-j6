import { Button, Link, Paragraph, Surface } from "@heroui/react";
import { useEffect, useState } from "react";

import {
  CONSENT_COPY,
  type ConsentDecision,
  hasValidConsent,
  setStoredConsent,
} from "../lib/cookie-consent";
import type { Locale } from "../lib/locale";
import { localizedPath } from "../lib/locale";

type CookieConsentBannerProps = {
  locale: Locale;
};

export default function CookieConsentBanner({ locale }: CookieConsentBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVisible(!hasValidConsent());
  }, []);

  const handleDecision = (decision: ConsentDecision) => {
    setStoredConsent(decision);
    setVisible(false);
  };

  if (!mounted || !visible) {
    return null;
  }

  const copy = CONSENT_COPY[locale];
  const privacyHref = localizedPath(locale, "privacy");

  return (
    <Surface className="cookie-consent" role="region" variant="default">
      <Surface className="cookie-consent__inner" variant="transparent">
        <Paragraph className="cookie-consent__message" size="sm">
          {copy.message}{" "}
          <Link className="cookie-consent__privacy-link" href={privacyHref}>
            {copy.privacyLabel}
          </Link>
        </Paragraph>
        <Surface className="cookie-consent__actions" variant="transparent">
          <Button
            className="button button--secondary button--md"
            onPress={() => handleDecision("declined")}
            type="button"
          >
            {copy.decline}
          </Button>
          <Button
            className="button button--primary button--md"
            onPress={() => handleDecision("accepted")}
            type="button"
          >
            {copy.accept}
          </Button>
        </Surface>
      </Surface>
    </Surface>
  );
}
