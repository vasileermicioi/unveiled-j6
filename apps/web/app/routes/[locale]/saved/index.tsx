import { listPartners, listSavedUpcomingEvents } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { SavedEventsPage } from "../../../components/discovery/SavedEventsPage";
import { getAuthOptions } from "../../../lib/auth";
import { toEventCardItem } from "../../../lib/catalog-mappers";
import { guardMemberAppRoute } from "../../../lib/member-app-route";
import { getSavedEventsCopy } from "../../../lib/saved-events-content";

export default createRoute(async (c) => {
  const guard = await guardMemberAppRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const userId = guard.session.user.id;

  const [subscription, savedEvents, hostPartners] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: (fields, { eq }) => eq(fields.userId, userId),
    }),
    listSavedUpcomingEvents(db, userId),
    listPartners(db, { limit: 500 }),
  ]);

  const subscriptionActive =
    subscription?.status === "ACTIVE" || subscription?.status === "CANCELLED_PENDING";
  const copy = getSavedEventsCopy(guard.locale);
  const hoursByPartnerId = new Map(
    hostPartners.map((partner) => [partner.id, partner.hasOpeningHours]),
  );

  return c.render(
    <SavedEventsPage
      events={savedEvents.map((event) =>
        toEventCardItem(event, guard.locale, {
          partnerHasOpeningHours: hoursByPartnerId.get(event.partnerId) ?? false,
        }),
      )}
      locale={guard.locale}
      subscriptionActive={subscriptionActive}
    />,
    {
      locale: guard.locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: `/${guard.locale}/saved`,
    },
  );
});
