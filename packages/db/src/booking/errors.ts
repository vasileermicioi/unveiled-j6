export type BookingErrorCode =
  | "EVENT_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "INELIGIBLE_SUBSCRIPTION"
  | "PAST_DUE"
  | "INSUFFICIENT_CREDITS"
  | "SOLD_OUT"
  | "INVALID_TICKET_COUNT"
  | "INVALID_REDEMPTION_CONFIG";

export class BookingError extends Error {
  readonly code: BookingErrorCode;

  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

export function isBookingError(error: unknown): error is BookingError {
  return error instanceof BookingError;
}
