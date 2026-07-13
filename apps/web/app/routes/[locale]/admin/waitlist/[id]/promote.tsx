import { eq, promoteWaitlistEntryAsAdmin, waitlistEntries } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";
import { AdminWaitlistPromotePage } from "../../../../../components/admin/AdminWaitlistPromotePage";
import {
  adminWaitlistPath,
  adminWaitlistPromotePath,
} from "../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import { guardAdminRoute, mapAdminOpsError, withAdminTxDb } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

async function loadEntry(entryId: string) {
  const { db } = getAuthOptions();
  return (
    (await db.query.waitlistEntries.findFirst({
      where: eq(waitlistEntries.id, entryId),
    })) ?? null
  );
}

function renderPage(
  c: Context,
  options: {
    locale: Locale;
    entry: NonNullable<Awaited<ReturnType<typeof loadEntry>>>;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);
  return renderAdminPage(
    c,
    <AdminWaitlistPromotePage
      action={adminWaitlistPromotePath(options.locale, options.entry.id)}
      entry={options.entry}
      error={options.error}
      locale={options.locale}
    />,
    {
      locale: options.locale,
      title: copy.waitlistPromoteTitle,
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const entryId = c.req.param("id");
  if (!entryId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const entry = await loadEntry(entryId);
  if (!entry) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  try {
    await withAdminTxDb(c, async (txDb) => {
      await promoteWaitlistEntryAsAdmin(txDb, {
        entryId,
        adminUserId: guard.session.user.id,
      });
    });
    return c.redirect(`${adminWaitlistPath(guard.locale)}?ok=promote`, 302);
  } catch (error) {
    return renderPage(c, {
      locale: guard.locale,
      entry,
      error: mapAdminOpsError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const entryId = c.req.param("id");
  if (!entryId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const entry = await loadEntry(entryId);
  if (!entry) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  return renderPage(c, {
    locale: guard.locale,
    entry,
  });
});
