export type AdminMemberErrorCode =
  | "USER_NOT_FOUND"
  | "ZERO_AMOUNT"
  | "INSUFFICIENT_CREDITS"
  | "INVALID_AMOUNT"
  | "INVALID_DESCRIPTION";

export class AdminMemberError extends Error {
  readonly code: AdminMemberErrorCode;

  constructor(code: AdminMemberErrorCode, message: string) {
    super(message);
    this.name = "AdminMemberError";
    this.code = code;
  }
}

export function isAdminMemberError(error: unknown): error is AdminMemberError {
  return error instanceof AdminMemberError;
}

export type AdminCapacityErrorCode =
  | "BOOKING_NOT_FOUND"
  | "NOT_CONFIRMED"
  | "INVALID_REASON"
  | "EVENT_NOT_FOUND";

export class AdminCapacityError extends Error {
  readonly code: AdminCapacityErrorCode;

  constructor(code: AdminCapacityErrorCode, message: string) {
    super(message);
    this.name = "AdminCapacityError";
    this.code = code;
  }
}

export function isAdminCapacityError(error: unknown): error is AdminCapacityError {
  return error instanceof AdminCapacityError;
}
