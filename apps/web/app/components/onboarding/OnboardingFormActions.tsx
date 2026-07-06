import { Button, Surface } from "@heroui/react";

type OnboardingFormActionsProps = {
  primaryLabel: string;
  showSkip?: boolean;
  skipLabel?: string;
};

export function OnboardingFormActions({
  primaryLabel,
  showSkip = false,
  skipLabel,
}: OnboardingFormActionsProps) {
  return (
    <Surface
      className="onboarding-form__actions flex flex-col gap-3 sm:flex-row sm:items-center"
      variant="transparent"
    >
      <Button className="button button--primary button--md sm:min-w-40" type="submit">
        {primaryLabel}
      </Button>
      {showSkip && skipLabel ? (
        <Button
          className="button button--secondary button--md sm:min-w-40"
          name="action"
          type="submit"
          value="skip"
        >
          {skipLabel}
        </Button>
      ) : null}
    </Surface>
  );
}
