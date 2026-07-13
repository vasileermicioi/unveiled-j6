export type GdprErrorCode =
  | "USER_NOT_FOUND"
  | "ALREADY_DELETED"
  | "INVALID_ACTOR"
  | "AUTH_DISABLE_FAILED"
  | "CANCEL_FAILED";

export class GdprError extends Error {
  readonly code: GdprErrorCode;

  constructor(code: GdprErrorCode, message: string) {
    super(message);
    this.name = "GdprError";
    this.code = code;
  }
}

export function isGdprError(error: unknown): error is GdprError {
  return error instanceof GdprError;
}
