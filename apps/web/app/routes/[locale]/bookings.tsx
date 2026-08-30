import { BOOKINGS_PAGE_SIZE, isBookingEligibleStatus, listUserBookings } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { MyTicketsPage } from "../../components/booking/MyTicketsPage";
import { getAuthOptions } from "../../lib/auth";
import { getBookConfirmCopy } from "../../lib/booking-content";
import { getMyTicketsCopy } from "../../lib/bookings-content";
import { bookingsListPageRedirectPath, parseBookingsListQuery } from "../../lib/bookings-list";
import { guardMemberAppRoute } from "../../lib/member-app-route";

export default createRoute(async (c) => {
  const guard = await guardMemberAppRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const userId = guard.session.user.id;
  const url = new URL(c.req.url);
  const query = parseBookingsListQuery(url);
  const basePath = `/${guard.locale}/bookings`;

  const [result, subscription] = await Promise.all([
    listUserBookings(db, {
      userId,
      page: query.page,
      pageSize: BOOKINGS_PAGE_SIZE,
    }),
    db.query.subscriptions.findFirst({
      where: (fields, { eq }) => eq(fields.userId, userId),
      columns: { status: true },
    }),
  ]);
  const subscriptionActive = isBookingEligibleStatus(subscription?.status);

  const redirectPath = bookingsListPageRedirectPath(basePath, query, result.total);
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const listCopy = getMyTicketsCopy(guard.locale);
  const confirmCopy = getBookConfirmCopy(guard.locale);
  const effectivePage = result.page;

  return c.render(
    <MyTicketsPage
      confirmCopy={confirmCopy}
      items={result.items}
      listCopy={listCopy}
      locale={guard.locale}
      page={effectivePage}
      pageSize={result.pageSize}
      subscriptionActive={subscriptionActive}
      total={result.total}
    />,
    {
      locale: guard.locale,
      title: listCopy.title,
      robots: "noindex",
      canonicalPath: `${basePath}${effectivePage > 1 ? `?page=${effectivePage}` : ""}`,
    },
  );
});
