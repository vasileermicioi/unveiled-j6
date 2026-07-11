import { Button, Card, Chip, Heading, Paragraph, Surface } from "@heroui/react";
import type { Story } from "@ladle/react";

/**
 * Theme Overview — adjust and verify Uber yellow brand tokens here.
 * Checklist: docs/product/ui/design-system.md
 */
export const ThemeOverview: Story = () => (
  <Surface className="flex max-w-3xl flex-col gap-8" variant="transparent">
    <Surface className="flex flex-col gap-2" variant="transparent">
      <Heading className="typography--h1" level={1}>
        Theme Overview
      </Heading>
      <Paragraph>
        Brand yellow backdrop (#FAFF86), Work Sans, near-zero radius, no drop shadows. Use this
        story when changing tokens in the shared brand theme.
      </Paragraph>
    </Surface>

    <Surface className="flex flex-col gap-3" variant="transparent">
      <Heading className="typography--h2" level={2}>
        Typography
      </Heading>
      <Heading className="typography--h1" level={1}>
        Display heading
      </Heading>
      <Paragraph>
        Body copy in Work Sans. Headings use uppercase, weight 900, and tight tracking via theme.
      </Paragraph>
      <Paragraph color="muted" size="sm">
        Muted metadata / supporting line
      </Paragraph>
    </Surface>

    <Surface className="flex flex-col gap-3" variant="transparent">
      <Heading className="typography--h2" level={2}>
        CTAs
      </Heading>
      <Surface className="flex flex-wrap gap-3" variant="transparent">
        <Button className="button button--primary button--md">Primary CTA</Button>
        <Button className="button button--secondary button--md">Secondary CTA</Button>
      </Surface>
    </Surface>

    <Surface className="flex flex-col gap-3" variant="transparent">
      <Heading className="typography--h2" level={2}>
        Surfaces
      </Heading>
      <Surface className="flex flex-wrap gap-2" variant="transparent">
        <Chip size="sm" variant="primary">
          <Chip.Label>Primary chip</Chip.Label>
        </Chip>
        <Chip size="sm" variant="secondary">
          <Chip.Label>Secondary chip</Chip.Label>
        </Chip>
        <Chip size="sm" variant="tertiary">
          <Chip.Label>Tertiary chip</Chip.Label>
        </Chip>
      </Surface>
      <Card variant="default">
        <Card.Header>
          <Card.Title>Sample card</Card.Title>
          <Card.Description>
            Bordered flat surface — near-zero radius, thick border, no shadow.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Paragraph size="sm">
            Cards float on the yellow page background. Theme tokens own color, border, and radius.
          </Paragraph>
        </Card.Content>
      </Card>
    </Surface>
  </Surface>
);

ThemeOverview.storyName = "Theme Overview";
