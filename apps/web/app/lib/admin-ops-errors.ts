import { isFreezeMemberError } from "@unveiled/billing";
import {
  isAdminCapacityError,
  isAdminMemberError,
  isBookingError,
  isWaitlistError,
} from "@unveiled/db";

import { getAdminCopy } from "./admin-content";
import type { Locale } from "./locale";

/** Map admin ops / booking / waitlist / freeze domain errors to locale copy. */
export function mapAdminOpsError(error: unknown, locale: Locale): string {
  const copy = getAdminCopy(locale);
  const errors = copy.adminOpsErrors;

  if (isAdminMemberError(error)) {
    return errors[error.code] ?? error.message ?? copy.genericError;
  }

  if (isAdminCapacityError(error)) {
    return errors[error.code] ?? error.message ?? copy.genericError;
  }

  if (isFreezeMemberError(error)) {
    return errors[error.code] ?? error.message ?? copy.genericError;
  }

  if (isBookingError(error)) {
    switch (error.code) {
      case "EVENT_NOT_FOUND":
        return errors.EVENT_NOT_FOUND;
      case "USER_NOT_FOUND":
        return errors.USER_NOT_FOUND;
      case "INELIGIBLE_SUBSCRIPTION":
        return errors.INELIGIBLE_SUBSCRIPTION;
      case "PAST_DUE":
        return errors.PAST_DUE;
      case "INSUFFICIENT_CREDITS":
        return errors.INSUFFICIENT_CREDITS;
      case "SOLD_OUT":
        return errors.SOLD_OUT;
      case "INVALID_TICKET_COUNT":
        return errors.INVALID_TICKET_COUNT;
      default:
        return error.message || copy.genericError;
    }
  }

  if (isWaitlistError(error)) {
    switch (error.code) {
      case "NOT_FOUND":
        return errors.WAITLIST_NOT_FOUND;
      case "NOT_WAITING":
        return errors.WAITLIST_NOT_WAITING;
      case "FORBIDDEN":
        return errors.WAITLIST_FORBIDDEN;
      case "INVALID_QTY":
        return errors.WAITLIST_INVALID_QTY;
      case "EVENT_NOT_FOUND":
        return errors.EVENT_NOT_FOUND;
      default:
        return error.message || copy.genericError;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return copy.genericError;
}
