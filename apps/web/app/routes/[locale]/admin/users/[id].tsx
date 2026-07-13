import { getMemberDetail, isAdminMemberError, listUserBookings } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminUserDetailPage, successCopy } from "../../../../components/admin/AdminUserDetailPage";
import { NotFoundPage } from "../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import { guardAdminRoute } from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const userId = c.req.param("id");
  if (!userId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const { db } = getAuthOptions();
  const copy = getAdminCopy(guard.locale);
  const okParam = new URL(c.req.url).searchParams.get("ok");

  try {
    const detail = await getMemberDetail(db, userId);
    const bookingsResult = await listUserBookings(db, { userId, pageSize: 20 });
    const confirmedBookings = bookingsResult.items.filter(
      (item) => item.booking.status === "CONFIRMED",
    );

    return renderAdminPage(
      c,
      <AdminUserDetailPage
        confirmedBookings={confirmedBookings}
        detail={detail}
        locale={guard.locale}
        successMessage={successCopy(copy, okParam)}
      />,
      {
        locale: guard.locale,
        title: copy.usersDetailTitle,
        subtitle: detail.user.email,
        canonicalPath: `/${guard.locale}/admin/users/${userId}`,
      },
    );
  } catch (error) {
    if (isAdminMemberError(error) && error.code === "USER_NOT_FOUND") {
      c.status(404);
      return c.render(<NotFoundPage locale={guard.locale} />, {
        locale: guard.locale,
        robots: "noindex",
        title: "Not Found — Unveiled Berlin",
      });
    }

    throw error;
  }
});
