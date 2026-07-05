import { Card, Paragraph, Surface } from "@heroui/react";

import type { Locale } from "../lib/locale";

type AuthFormFallbackProps = {
  locale?: Locale;
};

export function AuthFormFallback({ locale = "de" }: AuthFormFallbackProps) {
  const loadingLabel = locale === "de" ? "Formular wird geladen…" : "Loading form…";

  return (
    <Card aria-busy="true" className="auth-form auth-form--loading" variant="default">
      <Card.Content className="gap-4">
        <Surface className="flex flex-col gap-4" variant="transparent">
          <Surface className="auth-form__skeleton auth-form__skeleton--field" variant="transparent">
            {"\u00a0"}
          </Surface>
          <Surface className="auth-form__skeleton auth-form__skeleton--field" variant="transparent">
            {"\u00a0"}
          </Surface>
          <Surface
            className="auth-form__skeleton auth-form__skeleton--button"
            variant="transparent"
          >
            {"\u00a0"}
          </Surface>
          <Paragraph color="muted" size="sm">
            {loadingLabel}
          </Paragraph>
        </Surface>
      </Card.Content>
    </Card>
  );
}
