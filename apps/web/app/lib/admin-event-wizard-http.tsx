import {
  createEvent,
  getEventById,
  getVoucherInventoryCounts,
  listPartners,
  updateEvent,
} from "@unveiled/db";
import { ensureImageVariantsUploaded, getImageCredit } from "@unveiled/db/catalog/images";
import type { Context } from "hono";

import { eventListPath } from "../components/admin/EventAdminForm";
import { EventAdminWizardPage } from "../components/admin/EventAdminWizardPage";
import type { EventFormDefaults } from "../components/admin/event-admin-types";
import { NotFoundPage } from "../components/NotFoundPage";
import { getAdminCopy } from "./admin-content";
import {
  type EventFormStep,
  eventFormErrorStep,
  eventFormValuesToOccurrences,
} from "./admin-event-form";
import { toCreateEventInput, toUpdateEventInput } from "./admin-event-input";
import {
  eventToFormDefaults,
  formValuesToDefaults,
  toPartnerOptions,
} from "./admin-event-route-helpers";
import {
  type EventWizardTarget,
  eventWizardStepPath,
  parseWizardIntent,
} from "./admin-event-wizard";
import { renderAdminPage } from "./admin-render";
import { mapCatalogError, type ParsedBody, parseEventFormBodyFromRequest } from "./admin-route";
import {
  applyVoucherInventoryForEvents,
  assertCapacityMatchesInventory,
  assertVoucherInventoryForForm,
  voucherPayloadFromFormValues,
} from "./admin-voucher-inventory";
import { getAuthOptions } from "./auth";
import type { Locale } from "./locale";
import { resolveEnvVarFromContext } from "./runtime-env";
import { maybeProcessWaitlistAfterCapacityIncrease } from "./waitlist-capacity-hook";

function wizardIntentFromBody(body: ParsedBody) {
  const raw = body.wizard_intent;
  return parseWizardIntent(typeof raw === "string" ? raw : undefined);
}

function renderWizard(
  c: Context,
  options: {
    locale: Locale;
    step: EventFormStep;
    target: EventWizardTarget;
    partners: ReturnType<typeof toPartnerOptions>;
    defaults?: EventFormDefaults;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);
  const title = options.target.kind === "edit" ? copy.editEventTitle : copy.newEventTitle;
  return renderAdminPage(
    c,
    <EventAdminWizardPage
      defaults={options.defaults}
      error={options.error ?? null}
      locale={options.locale}
      partners={options.partners}
      step={options.step}
      target={options.target}
    />,
    {
      locale: options.locale,
      title,
    },
  );
}

function notFound(c: Context, locale: Locale) {
  c.status(404);
  return c.render(<NotFoundPage locale={locale} />, {
    locale,
    robots: "noindex",
    title: "Not Found — Unveiled Berlin",
  });
}

export async function getEventCreateWizard(c: Context, locale: Locale, step: EventFormStep) {
  if (step !== 1) {
    return c.redirect(eventWizardStepPath(locale, { kind: "new" }, 1), 302);
  }

  const { db } = getAuthOptions();
  const partners = await listPartners(db, { limit: 1000 });
  return renderWizard(c, {
    locale,
    step,
    target: { kind: "new" },
    partners: toPartnerOptions(partners),
  });
}

export async function postEventCreateWizard(
  c: Context,
  locale: Locale,
  step: EventFormStep,
  uploadedBy: string,
) {
  const { db } = getAuthOptions();
  const partners = await listPartners(db, { limit: 1000 });
  const partnerOptions = toPartnerOptions(partners);
  const body = (await c.req.parseBody({ all: true })) as ParsedBody;
  const intent = wizardIntentFromBody(body);
  const target: EventWizardTarget = { kind: "new" };

  try {
    const values = await parseEventFormBodyFromRequest(body);
    const defaults = formValuesToDefaults(values);

    if (intent === "next" || intent === "back") {
      if (intent === "next" && step === 3) {
        eventFormValuesToOccurrences(values);
        const payload = voucherPayloadFromFormValues(values);
        await assertVoucherInventoryForForm(db, {
          ticketType: values.ticketType,
          payload,
          mode: "create",
        });
        assertCapacityMatchesInventory(values);
      }
      return renderWizard(c, {
        locale,
        step,
        target,
        partners: partnerOptions,
        defaults,
      });
    }

    const payload = voucherPayloadFromFormValues(values);
    await assertVoucherInventoryForForm(db, {
      ticketType: values.ticketType,
      payload,
      mode: "create",
    });
    assertCapacityMatchesInventory(values);
    const event = await createEvent(db, toCreateEventInput(values, uploadedBy));
    await applyVoucherInventoryForEvents(db, {
      eventIds: [event.id],
      ticketType: values.ticketType,
      payload,
    });
    return c.redirect(eventListPath(locale), 302);
  } catch (error) {
    let defaults: EventFormDefaults | undefined;
    try {
      defaults = formValuesToDefaults(await parseEventFormBodyFromRequest(body));
    } catch {
      defaults = undefined;
    }

    return renderWizard(c, {
      locale,
      step: eventFormErrorStep(error),
      target,
      partners: partnerOptions,
      defaults,
      error: mapCatalogError(error, locale),
    });
  }
}

export async function getEventEditWizard(
  c: Context,
  locale: Locale,
  eventId: string,
  step: EventFormStep,
) {
  const { db } = getAuthOptions();
  const event = await getEventById(db, eventId);
  if (!event) {
    return notFound(c, locale);
  }

  await ensureImageVariantsUploaded(db, event.imageId);
  const partners = await listPartners(db, { limit: 1000 });
  const inventoryCounts = await getVoucherInventoryCounts(db, eventId);
  const currentImageCredit = await getImageCredit(db, event.imageId);

  return renderWizard(c, {
    locale,
    step,
    target: { kind: "edit", eventId },
    partners: toPartnerOptions(partners),
    defaults: eventToFormDefaults(event, inventoryCounts, currentImageCredit),
  });
}

export async function postEventEditWizard(
  c: Context,
  locale: Locale,
  eventId: string,
  uploadedBy: string,
) {
  const { db } = getAuthOptions();
  const existing = await getEventById(db, eventId);
  if (!existing) {
    return notFound(c, locale);
  }

  const partners = await listPartners(db, { limit: 1000 });
  const partnerOptions = toPartnerOptions(partners);
  const body = (await c.req.parseBody({ all: true })) as ParsedBody;
  const target: EventWizardTarget = { kind: "edit", eventId };

  try {
    const inventoryCounts = await getVoucherInventoryCounts(db, eventId);
    const values = await parseEventFormBodyFromRequest(body);
    const payload = voucherPayloadFromFormValues(values);
    await assertVoucherInventoryForForm(db, {
      eventId,
      ticketType: values.ticketType,
      payload,
      mode: "edit",
    });
    assertCapacityMatchesInventory(values, inventoryCounts);
    const previousRemaining = existing.remainingCapacity;
    const updated = await updateEvent(db, eventId, toUpdateEventInput(values, uploadedBy));
    await applyVoucherInventoryForEvents(db, {
      eventIds: [eventId],
      ticketType: values.ticketType,
      payload,
    });

    const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");
    if (databaseUrl && updated.remainingCapacity > previousRemaining) {
      await maybeProcessWaitlistAfterCapacityIncrease({
        c,
        databaseUrl,
        eventId,
        previousRemaining,
        nextRemaining: updated.remainingCapacity,
        locale,
        event: {
          id: updated.id,
          title: updated.title,
          address: updated.address,
          dateTime: updated.dateTime,
          partnerName: updated.partnerName,
        },
        resolveToEmail: async (userId) => {
          const user = await db.query.users.findFirst({
            where: (fields, { eq }) => eq(fields.id, userId),
          });
          return user?.email;
        },
      });
    }

    return c.redirect(eventListPath(locale), 302);
  } catch (error) {
    await ensureImageVariantsUploaded(db, existing.imageId);
    const inventoryCounts = await getVoucherInventoryCounts(db, eventId);
    const existingCredit = await getImageCredit(db, existing.imageId);
    const existingDefaults = eventToFormDefaults(existing, inventoryCounts, existingCredit);
    let defaults = existingDefaults;
    try {
      const formDefaults = formValuesToDefaults(await parseEventFormBodyFromRequest(body));
      const stagedImageId = formDefaults.currentImageId;
      defaults = {
        ...existingDefaults,
        ...formDefaults,
        eventId,
        inventoryCounts,
        currentImageId: stagedImageId ?? existingDefaults.currentImageId,
        currentImageUrl:
          stagedImageId && stagedImageId !== existingDefaults.currentImageId
            ? null
            : existingDefaults.currentImageUrl,
        imagePublicBaseUrl: formDefaults.imagePublicBaseUrl ?? existingDefaults.imagePublicBaseUrl,
      };
    } catch {
      // keep existing defaults
    }

    return renderWizard(c, {
      locale,
      step: eventFormErrorStep(error),
      target,
      partners: partnerOptions,
      defaults,
      error: mapCatalogError(error, locale),
    });
  }
}
