import { createRoute } from "honox/factory";
import { renderOnboardingStepPage } from "../../../lib/onboarding-render";
import {
  guardOnboardingStep,
  handleOnboardingPost,
  parseInterestsPayload,
} from "../../../lib/onboarding-route";

export const POST = createRoute(async (c) => {
  const result = await handleOnboardingPost(c, "interests", parseInterestsPayload);

  if (result instanceof Response) {
    return result;
  }

  if (result.kind === "redirect") {
    return c.redirect(result.location, 302);
  }

  return renderOnboardingStepPage(c, {
    locale: result.locale,
    step: "interests",
    profile: result.profile,
    error: result.message,
  });
});

export default createRoute(async (c) => {
  const guard = await guardOnboardingStep(c, "interests");
  if (!guard.ok) {
    return guard.response;
  }

  return renderOnboardingStepPage(c, {
    locale: guard.locale,
    step: "interests",
    profile: guard.session.user.profile,
  });
});
