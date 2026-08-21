import { Link, Surface } from "@heroui/react";

import EventAdminForm from "../../islands/EventAdminForm";
import { getAdminCopy } from "../../lib/admin-content";
import type { EventFormStep } from "../../lib/admin-event-form";
import {
  type EventWizardTarget,
  eventAdminFormDraftId,
  eventWizardStepHrefs,
} from "../../lib/admin-event-wizard";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { AdminPageShell, adminEventGalleryPath, adminEventsPath } from "./AdminPageShell";
import { eventListPath } from "./EventAdminForm";
import type { EventFormDefaults, PartnerOption } from "./event-admin-types";

type EventAdminWizardPageProps = {
  locale: Locale;
  step: EventFormStep;
  target: EventWizardTarget;
  partners: PartnerOption[];
  defaults?: EventFormDefaults;
  error?: string | null;
};

export function EventAdminWizardPage({
  locale,
  step,
  target,
  partners,
  defaults,
  error = null,
}: EventAdminWizardPageProps) {
  const copy = getAdminCopy(locale);
  const isEdit = target.kind === "edit";
  const title = isEdit ? copy.editEventTitle : copy.newEventTitle;
  const hrefs = eventWizardStepHrefs(locale, target);
  const eventId = target.kind === "edit" ? target.eventId : null;

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      actions={
        eventId ? (
          <Surface className="flex flex-wrap items-center gap-2" variant="transparent">
            <Link
              className="button button--secondary button--md"
              href={adminEventGalleryPath(locale, eventId)}
            >
              {copy.galleryManageAction}
            </Link>
            <Link
              className="button button--secondary button--md"
              href={localizedPath(locale, `admin/events/${eventId}/clone`)}
            >
              {copy.cloneAction}
            </Link>
          </Surface>
        ) : undefined
      }
      breadcrumbs={[{ label: copy.eventsTitle, href: adminEventsPath(locale) }, { label: title }]}
      title={title}
    >
      <EventAdminForm
        action={hrefs[step]}
        cancelHref={eventListPath(locale)}
        defaults={defaults}
        error={error}
        formId={eventAdminFormDraftId(target)}
        isEdit={isEdit}
        locale={locale}
        partners={partners}
        step={step}
        stepHrefs={hrefs}
        submitLabel={isEdit ? copy.save : copy.create}
      />
    </AdminPageShell>
  );
}
