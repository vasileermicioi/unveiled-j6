import { Button, Card, Form, Heading, Link, Paragraph, Surface } from "@heroui/react";
import { Coins, Sparkles, Ticket } from "lucide-react";

import type { MembershipCheckoutContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type MembershipViewState = "guest" | "checkout" | "active" | "frozen" | "error";

type MembershipInfoPageProps = {
  content: MembershipCheckoutContent;
  locale: Locale;
  view: MembershipViewState;
  errorMessage?: string | null;
};

const PERK_ICONS = [Ticket, Sparkles, Coins] as const;

export function MembershipInfoPage({
  content,
  locale,
  view,
  errorMessage,
}: MembershipInfoPageProps) {
  const headline =
    view === "active"
      ? content.alreadyActive
      : view === "frozen"
        ? content.paymentStoppedTitle
        : content.title;

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Card className="membership-hero">
        <Card.Content className="flex flex-col gap-8">
          <Surface className="flex flex-col gap-4" variant="transparent">
            <Heading level={1}>{headline}</Heading>
            {view === "active" ? (
              <>
                <Paragraph color="muted">{content.successSubtitle}</Paragraph>
                <Paragraph color="muted" size="sm">
                  {content.activeStatus}
                </Paragraph>
              </>
            ) : null}
            {view === "frozen" ? (
              <Paragraph color="muted">{content.paymentStoppedBody}</Paragraph>
            ) : null}
            {view === "error" ? <Paragraph color="muted">{content.errorSubtitle}</Paragraph> : null}
            {errorMessage ? (
              <Paragraph color="muted" size="sm">
                {errorMessage}
              </Paragraph>
            ) : null}
          </Surface>

          <Surface
            className="membership-hero__body grid gap-8 lg:grid-cols-2 lg:items-center"
            variant="transparent"
          >
            <Surface
              className="membership-benefits__list flex flex-col gap-4"
              variant="transparent"
            >
              {content.perks.map((perk, index) => {
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
              {view === "guest" ? (
                <>
                  <Paragraph color="muted" size="sm">
                    {content.guestPrompt}
                  </Paragraph>
                  <Link
                    className="button button--primary button--md"
                    href={localizedPath(locale, "signup")}
                  >
                    {content.signupCta}
                  </Link>
                  <Link
                    className="button button--secondary button--md"
                    href={localizedPath(locale, "login")}
                  >
                    {content.loginCta}
                  </Link>
                </>
              ) : null}

              {view === "checkout" || view === "error" ? (
                <>
                  <Form
                    action={localizedPath(locale, "membership")}
                    className="flex w-full justify-start lg:justify-center"
                    method="post"
                  >
                    <Button className="button button--primary button--md" type="submit">
                      {content.button}
                    </Button>
                  </Form>
                  <Paragraph className="uppercase tracking-wide" color="muted" size="xs">
                    {content.secure}
                  </Paragraph>
                </>
              ) : null}

              {view === "active" ? (
                <Link
                  className="button button--primary button--md"
                  href={localizedPath(locale, "events")}
                >
                  {content.successTitle}
                </Link>
              ) : null}

              {view === "frozen" ? (
                <Link
                  className="button button--secondary button--md"
                  href={`mailto:${content.supportEmail}`}
                >
                  {content.supportCta}
                </Link>
              ) : null}
            </Surface>
          </Surface>
        </Card.Content>
      </Card>
    </Surface>
  );
}
