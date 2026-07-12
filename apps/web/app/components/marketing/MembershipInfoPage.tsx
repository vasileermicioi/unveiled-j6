import { Button, Card, Form, Heading, Link, Paragraph, Surface } from "@heroui/react";

import type { MembershipCheckoutContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { SectionCard } from "./SectionCard";

export type MembershipViewState = "guest" | "checkout" | "active" | "frozen" | "error";

type MembershipInfoPageProps = {
  content: MembershipCheckoutContent;
  locale: Locale;
  view: MembershipViewState;
  errorMessage?: string | null;
};

export function MembershipInfoPage({
  content,
  locale,
  view,
  errorMessage,
}: MembershipInfoPageProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <Card className="membership-hero">
        <Card.Content className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
          <Surface className="flex flex-col gap-4" variant="transparent">
            <Heading level={1}>
              {view === "active"
                ? content.alreadyActive
                : view === "frozen"
                  ? content.paymentStoppedTitle
                  : content.title}
            </Heading>
            <Paragraph color="muted">
              {view === "active"
                ? content.successSubtitle
                : view === "frozen"
                  ? content.paymentStoppedBody
                  : content.subtitle}
            </Paragraph>
            {view === "active" ? (
              <Paragraph color="muted" size="sm">
                {content.activeStatus}
              </Paragraph>
            ) : view === "guest" || view === "checkout" || view === "error" ? (
              <Paragraph color="muted" size="sm">
                {content.guarantee}
              </Paragraph>
            ) : null}
            {errorMessage ? (
              <Paragraph color="muted" size="sm">
                {errorMessage}
              </Paragraph>
            ) : null}
          </Surface>

          <Surface className="flex flex-col gap-3" variant="transparent">
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
                <Form action={localizedPath(locale, "membership")} method="post">
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
        </Card.Content>
      </Card>

      <Surface className="grid gap-6 md:grid-cols-3" variant="transparent">
        {content.perks.map((perk) => (
          <SectionCard key={perk} title={perk} />
        ))}
      </Surface>
    </Surface>
  );
}
