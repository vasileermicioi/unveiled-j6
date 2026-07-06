import { createRoute } from "honox/factory";
import { renderOnboardingStepPage } from "../../../lib/onboarding-render";
import {
  guardOnboardingStep,
  handleOnboardingPost,
  parseAgePayload,
} from "../../../lib/onboarding-route";

export const POST = createRoute(async (c) => {
  const result = await handleOnboardingPost(c, "age", parseAgePayload);

  if (result instanceof Response) {
    return result;
  }

  if (result.kind === "redirect") {
    return c.redirect(result.location, 302);
  }

  return renderOnboardingStepPage(c, {
    locale: result.locale,
    step: "age",
    profile: result.profile,
    error: result.message,
  });
});

export default createRoute(async (c) => {
  const guard = await guardOnboardingStep(c, "age");
  if (!guard.ok) {
    return guard.response;
  }

  return renderOnboardingStepPage(c, {
    locale: guard.locale,
    step: "age",
    profile: guard.session.user.profile,
  });
});
