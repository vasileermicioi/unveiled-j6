import { createRoute } from "honox/factory";

import {
  getEventCreateWizard,
  postEventCreateWizard,
} from "../../../../../lib/admin-event-wizard-http";
import { guardAdminRoute } from "../../../../../lib/admin-route";

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  return postEventCreateWizard(c, guard.locale, 3, guard.session.user.id);
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  return getEventCreateWizard(c, guard.locale, 3);
});
