import { getMemberDetail, isAdminMemberError, isGdprError } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminDeleteAccountForm } from "../../../../../components/admin/AdminDeleteAccountForm";
import {
  adminUserDeleteAccountPath,
  adminUsersPath,
} from "../../../../../components/admin/admin-tabs";
import { memberDisplayName } from "../../../../../components/admin/member-display";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import { guardAdminRoute } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import { mapGdprErrorMessage } from "../../../../../lib/gdpr-content";
import { anonymizeMemberAsAdmin } from "../../../../../lib/gdpr-route";
import type { Locale } from "../../../../../lib/locale";

async function loadMember(userId: string) {
  const { db } = getAuthOptions();
  try {
    return await getMemberDetail(db, userId);
  } catch (error) {
    if (isAdminMemberError(error) && error.code === "USER_NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

function renderPage(
  c: Context,
  options: {
    locale: Locale;
    userId: string;
    memberLabel: string;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminDeleteAccountForm
      action={adminUserDeleteAccountPath(options.locale, options.userId)}
      error={options.error}
      locale={options.locale}
      memberLabel={options.memberLabel}
      userId={options.userId}
    />,
    {
      locale: options.locale,
      title: copy.deleteAccountTitle,
      canonicalPath: adminUserDeleteAccountPath(options.locale, options.userId),
    },
  );
}

export const POST = createRoute(async (c) => {
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

  const detail = await loadMember(userId);
  if (!detail) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const memberLabel = memberDisplayName(detail.user.profile, detail.user.email);

  try {
    await anonymizeMemberAsAdmin(c, {
      userId,
      adminId: guard.session.user.id,
    });
    return c.redirect(`${adminUsersPath(guard.locale)}?ok=delete-account`, 302);
  } catch (error) {
    if (isGdprError(error) && error.code === "ALREADY_DELETED") {
      return c.redirect(`${adminUsersPath(guard.locale)}?ok=delete-account`, 302);
    }

    const message = isGdprError(error)
      ? mapGdprErrorMessage(error.code, guard.locale)
      : getAdminCopy(guard.locale).genericError;

    return renderPage(c, {
      locale: guard.locale,
      userId,
      memberLabel,
      error: message,
    });
  }
});

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

  const detail = await loadMember(userId);
  if (!detail) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  return renderPage(c, {
    locale: guard.locale,
    userId,
    memberLabel: memberDisplayName(detail.user.profile, detail.user.email),
  });
});
