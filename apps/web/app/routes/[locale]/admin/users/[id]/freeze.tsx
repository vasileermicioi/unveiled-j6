import { freezeMember, unfreezeMember } from "@unveiled/billing";
import { getMemberDetail, isAdminMemberError } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";
import {
  AdminFreezeForm,
  type FreezeAction,
} from "../../../../../components/admin/AdminFreezeForm";
import {
  adminUserDetailPath,
  adminUserFreezePath,
} from "../../../../../components/admin/admin-tabs";
import { memberDisplayName } from "../../../../../components/admin/member-display";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import { guardAdminRoute, mapAdminOpsError, withAdminTxDb } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

function resolveFreezeAction(status: string | undefined): FreezeAction {
  if (status === "ACTIVE") {
    return "freeze";
  }
  if (status === "UNPAID") {
    return "unfreeze";
  }
  return "unavailable";
}

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
    freezeAction: FreezeAction;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);
  const title = options.freezeAction === "unfreeze" ? copy.unfreezeTitle : copy.freezeTitle;

  return renderAdminPage(
    c,
    <AdminFreezeForm
      action={adminUserFreezePath(options.locale, options.userId)}
      error={options.error}
      freezeAction={options.freezeAction}
      locale={options.locale}
      memberLabel={options.memberLabel}
      userId={options.userId}
    />,
    {
      locale: options.locale,
      title,
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
  const freezeAction = resolveFreezeAction(detail.subscription?.status);

  if (freezeAction === "unavailable") {
    return renderPage(c, {
      locale: guard.locale,
      userId,
      memberLabel,
      freezeAction,
      error: getAdminCopy(guard.locale).freezeUnavailable,
    });
  }

  try {
    await withAdminTxDb(c, async (txDb) => {
      if (freezeAction === "freeze") {
        await freezeMember(txDb, { userId });
      } else {
        await unfreezeMember(txDb, { userId });
      }
    });
    const ok = freezeAction === "freeze" ? "freeze" : "unfreeze";
    return c.redirect(`${adminUserDetailPath(guard.locale, userId)}?ok=${ok}`, 302);
  } catch (error) {
    return renderPage(c, {
      locale: guard.locale,
      userId,
      memberLabel,
      freezeAction,
      error: mapAdminOpsError(error, guard.locale),
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
    freezeAction: resolveFreezeAction(detail.subscription?.status),
  });
});
