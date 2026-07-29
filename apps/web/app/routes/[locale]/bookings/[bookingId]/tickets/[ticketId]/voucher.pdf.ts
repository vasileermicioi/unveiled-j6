import { getOwnedBookingTicketPdf } from "@unveiled/db";
import { getObject } from "@unveiled/images";
import { createRoute } from "honox/factory";

import { getAuthOptions } from "../../../../../../lib/auth";
import { guardMemberAppRoute } from "../../../../../../lib/member-app-route";

function attachmentFilename(ordinal: number, originalFilename: string | null): string {
  const fallback = `voucher-${ordinal}.pdf`;
  if (!originalFilename) {
    return fallback;
  }
  const base = originalFilename.split(/[/\\]/).pop() ?? "";
  const safe = base.replace(/[^\w.-]+/g, "_").replace(/^\.+/, "");
  if (!safe.toLowerCase().endsWith(".pdf")) {
    return fallback;
  }
  return safe.slice(0, 120) || fallback;
}

/**
 * Auth-gated PDF voucher download for the booking owner.
 * Guests → login redirect; other users / missing ticket → 404.
 */
export default createRoute(async (c) => {
  const guard = await guardMemberAppRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const bookingId = c.req.param("bookingId");
  const ticketId = c.req.param("ticketId");
  if (!bookingId || !ticketId) {
    return c.body("Not Found", 404);
  }

  const { db } = getAuthOptions();
  const owned = await getOwnedBookingTicketPdf(db, {
    userId: guard.session.user.id,
    bookingId,
    ticketId,
  });

  if (!owned) {
    return c.body("Not Found", 404);
  }

  try {
    const bytes = await getObject({ objectKey: owned.objectKey });
    const filename = attachmentFilename(owned.ordinal, owned.originalFilename);
    const body = Uint8Array.from(bytes);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return c.body("Not Found", 404);
  }
});
