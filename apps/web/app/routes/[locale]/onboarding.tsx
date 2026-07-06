import { createRoute } from "honox/factory";

import { redirectOnboardingEntry } from "../../lib/onboarding-route";

export default createRoute(async (c) => redirectOnboardingEntry(c));
