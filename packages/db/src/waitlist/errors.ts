export type WaitlistErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "NOT_WAITING"
  | "INVALID_QTY"
  | "EVENT_NOT_FOUND";

export class WaitlistError extends Error {
  readonly code: WaitlistErrorCode;

  constructor(code: WaitlistErrorCode, message: string) {
    super(message);
    this.name = "WaitlistError";
    this.code = code;
  }
}

export function isWaitlistError(error: unknown): error is WaitlistError {
  return error instanceof WaitlistError;
}
