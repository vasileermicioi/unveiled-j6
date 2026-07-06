import { createRoute } from "honox/factory";
import { renderOnboardingStepPage } from "../../../lib/onboarding-render";
import {
  guardOnboardingStep,
  handleOnboardingPost,
  parseTimingPayload,
} from "../../../lib/onboarding-route";

export const POST = createRoute(async (c) => {
  const result = await handleOnboardingPost(c, "timing", parseTimingPayload);

  if (result instanceof Response) {
    return result;
  }

  if (result.kind === "redirect") {
    return c.redirect(result.location, 302);
  }

  return renderOnboardingStepPage(c, {
    locale: result.locale,
    step: "timing",
    profile: result.profile,
    error: result.message,
  });
});

export default createRoute(async (c) => {
  const guard = await guardOnboardingStep(c, "timing");
  if (!guard.ok) {
    return guard.response;
  }

  return renderOnboardingStepPage(c, {
    locale: guard.locale,
    step: "timing",
    profile: guard.session.user.profile,
  });
});
