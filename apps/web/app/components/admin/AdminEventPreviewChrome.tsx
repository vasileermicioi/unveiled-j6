import { Chip, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import {
  adminEventPreviewBrowsePath,
  adminEventPreviewDiscoverPath,
  adminEventPreviewPath,
  adminEventPublishPath,
  adminEventUnpublishPath,
} from "./admin-tabs";

export type AdminEventPreviewAudience = "guest" | "member";
export type AdminEventPreviewSurface = "detail" | "browse" | "discover";

type AdminEventPreviewChromeProps = {
  locale: Locale;
  eventId: string;
  published: boolean;
  surface: AdminEventPreviewSurface;
  audience?: AdminEventPreviewAudience;
};

export function AdminEventPreviewChrome({
  locale,
  eventId,
  published,
  surface,
  audience = "guest",
}: AdminEventPreviewChromeProps) {
  const copy = getAdminCopy(locale);
  const guestHref = adminEventPreviewPath(locale, eventId);
  const memberHref = adminEventPreviewPath(locale, eventId, "member");
  const editHref = localizedPath(locale, `admin/events/${eventId}/edit`);
  const publishHref = published
    ? adminEventUnpublishPath(locale, eventId)
    : adminEventPublishPath(locale, eventId);

  const surfaces: { id: AdminEventPreviewSurface; href: string; label: string }[] = [
    { id: "detail", href: guestHref, label: copy.previewSurfaceDetail },
    {
      id: "browse",
      href: adminEventPreviewBrowsePath(locale, eventId),
      label: copy.previewSurfaceBrowse,
    },
    {
      id: "discover",
      href: adminEventPreviewDiscoverPath(locale, eventId),
      label: copy.previewSurfaceDiscover,
    },
  ];

  return (
    <Surface className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pt-6 sm:px-6 lg:px-8">
      <Surface className="flex flex-wrap items-center gap-3" variant="transparent">
        <Paragraph>{copy.previewBanner}</Paragraph>
        <Chip variant="tertiary">
          <Chip.Label>{published ? copy.statusPublished : copy.statusDraft}</Chip.Label>
        </Chip>
        <Link className="link" href={editHref}>
          {copy.editAction}
        </Link>
        <Link className="link" href={publishHref}>
          {published ? copy.unpublishAction : copy.publishAction}
        </Link>
      </Surface>
      <Surface className="flex flex-wrap items-center gap-3" variant="transparent">
        {surfaces.map((item) => (
          <Link
            aria-current={surface === item.id ? "page" : undefined}
            className="link"
            href={item.href}
            key={item.id}
          >
            {item.label}
          </Link>
        ))}
      </Surface>
      {surface === "detail" ? (
        <Surface className="flex flex-wrap items-center gap-3" variant="transparent">
          <Link
            aria-current={audience === "guest" ? "page" : undefined}
            className="link"
            href={guestHref}
          >
            {copy.previewAudienceGuest}
          </Link>
          <Link
            aria-current={audience === "member" ? "page" : undefined}
            className="link"
            href={memberHref}
          >
            {copy.previewAudienceMember}
          </Link>
        </Surface>
      ) : null}
    </Surface>
  );
}
