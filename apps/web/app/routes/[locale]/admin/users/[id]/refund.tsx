import { getMemberDetail, isAdminMemberError, refundMemberCredits } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";
import { AdminRefundForm } from "../../../../../components/admin/AdminRefundForm";
import {
  adminUserDetailPath,
  adminUserRefundPath,
} from "../../../../../components/admin/admin-tabs";
import { memberDisplayName } from "../../../../../components/admin/member-display";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import { guardAdminRoute, mapAdminOpsError, withAdminTxDb } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

function asString(value: string | File | (string | File)[] | undefined): string {
  if (value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : "";
  }
  return typeof value === "string" ? value : "";
}

async function loadMemberLabel(userId: string): Promise<string | null> {
  const { db } = getAuthOptions();
  try {
    const detail = await getMemberDetail(db, userId);
    return memberDisplayName(detail.user.profile, detail.user.email);
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
    defaultAmount?: string;
    defaultReason?: string;
  },
) {
  const copy = getAdminCopy(options.locale);
  return renderAdminPage(
    c,
    <AdminRefundForm
      action={adminUserRefundPath(options.locale, options.userId)}
      defaultAmount={options.defaultAmount}
      defaultReason={options.defaultReason}
      error={options.error}
      locale={options.locale}
      memberLabel={options.memberLabel}
      userId={options.userId}
    />,
    {
      locale: options.locale,
      title: copy.refundTitle,
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

  const memberLabel = await loadMemberLabel(userId);
  if (!memberLabel) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
  const amountRaw = asString(body.amount).trim();
  const description = asString(body.description);
  const amount = Number.parseInt(amountRaw, 10);

  try {
    await withAdminTxDb(c, async (txDb) => {
      await refundMemberCredits(txDb, {
        userId,
        amount: Number.isFinite(amount) ? amount : Number.NaN,
        description,
      });
    });
    return c.redirect(`${adminUserDetailPath(guard.locale, userId)}?ok=refund`, 302);
  } catch (error) {
    return renderPage(c, {
      locale: guard.locale,
      userId,
      memberLabel,
      error: mapAdminOpsError(error, guard.locale),
      defaultAmount: amountRaw,
      defaultReason: description,
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

  const memberLabel = await loadMemberLabel(userId);
  if (!memberLabel) {
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
    memberLabel,
  });
});
