/**
 * Transactional email package (Phase 6+).
 *
 * Env vars (finalize in apps/web/DEPLOYMENT.md in payments-booking-05):
 * - RESEND_API_KEY
 * - DAILY_CODES_FROM_EMAIL (booking confirmation from-address for Phase 6)
 *
 * Post-commit policy: send booking confirmation only after `bookEvent` commits.
 * On Resend failure, log booking id / user id and do not roll back the booking.
 */

export type {
  BookingConfirmationContent,
  BookingLocale,
  BuildBookingConfirmationInput,
} from "./booking-confirmation";
export { buildBookingConfirmationContent } from "./booking-confirmation";
export { type BuildIcsInput, buildEventIcs, formatIcsUtc } from "./ics";
export {
  type ResendAttachment,
  type SendResendEmailInput,
  type SendResendEmailResult,
  sendResendEmail,
} from "./resend-client";
export {
  type SendBookingConfirmationInput,
  sendBookingConfirmation,
} from "./send-booking-confirmation";
export {
  type SendSubscriptionInvoiceInput,
  sendSubscriptionInvoice,
} from "./send-subscription-invoice";
export {
  type SendWaitlistPromotionInput,
  sendWaitlistPromotion,
} from "./send-waitlist-promotion";
export {
  type BuildSubscriptionInvoiceInput,
  buildSubscriptionInvoiceContent,
  type SubscriptionInvoiceContent,
  type SubscriptionInvoiceLocale,
} from "./subscription-invoice";
export {
  type BuildWaitlistPromotionInput,
  buildWaitlistPromotionContent,
} from "./waitlist-promotion";

export const EMAIL_PACKAGE = "@unveiled/email" as const;
export type EmailPackageId = typeof EMAIL_PACKAGE;
