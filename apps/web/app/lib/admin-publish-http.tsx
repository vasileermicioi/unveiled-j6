import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminPublishConfirmPage } from "../components/admin/AdminPublishConfirmPage";
import { NotFoundPage } from "../components/NotFoundPage";
import { renderAdminPage } from "./admin-render";
import { guardAdminRoute, mapCatalogError } from "./admin-route";
import type { Locale } from "./locale";

type PublishConfirmCopy = {
  title: string;
  body: string;
  submitLabel: string;
  note?: string | null;
};

type PublishConfirmPageModel = {
  locale: Locale;
  breadcrumbs: { label: string; href?: string }[];
  copy: PublishConfirmCopy;
  action: string;
  cancelHref: string;
  error?: string | null;
};

export function renderPublishConfirmPage(c: Context, model: PublishConfirmPageModel) {
  return renderAdminPage(
    c,
    <AdminPublishConfirmPage
      action={model.action}
      body={model.copy.body}
      breadcrumbs={model.breadcrumbs}
      cancelHref={model.cancelHref}
      error={model.error}
      locale={model.locale}
      note={model.copy.note}
      submitLabel={model.copy.submitLabel}
      title={model.copy.title}
    />,
    {
      locale: model.locale,
      title: model.copy.title,
    },
  );
}

export function notFoundAdmin(c: Context, locale: Locale) {
  c.status(404);
  return c.render(<NotFoundPage locale={locale} />, {
    locale,
    robots: "noindex",
    title: "Not Found — Unveiled Berlin",
  });
}

export function createAdminPublishRoute<T>(options: {
  load: (
    c: Context,
    locale: Locale,
  ) => Promise<{ ok: true; resource: T } | { ok: false; missing: true }>;
  page: (resource: T, locale: Locale, error?: string | null) => PublishConfirmPageModel;
  persist: (resource: T) => Promise<void>;
  successHref: (resource: T, locale: Locale) => string;
}) {
  const GET = createRoute(async (c) => {
    const guard = await guardAdminRoute(c);
    if (!guard.ok) {
      return guard.response;
    }

    const loaded = await options.load(c, guard.locale);
    if (!loaded.ok) {
      return notFoundAdmin(c, guard.locale);
    }

    return renderPublishConfirmPage(c, options.page(loaded.resource, guard.locale));
  });

  const POST = createRoute(async (c) => {
    const guard = await guardAdminRoute(c);
    if (!guard.ok) {
      return guard.response;
    }

    const loaded = await options.load(c, guard.locale);
    if (!loaded.ok) {
      return notFoundAdmin(c, guard.locale);
    }

    try {
      await options.persist(loaded.resource);
      return c.redirect(options.successHref(loaded.resource, guard.locale), 302);
    } catch (error) {
      return renderPublishConfirmPage(
        c,
        options.page(loaded.resource, guard.locale, mapCatalogError(error, guard.locale)),
      );
    }
  });

  return { GET, POST };
}
