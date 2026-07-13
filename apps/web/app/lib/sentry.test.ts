import { describe, expect, test } from "bun:test";

import { buildSentryOptions } from "./sentry";

describe("buildSentryOptions", () => {
  test("disables Sentry when DSN is unset on bindings and process", () => {
    const previous = process.env.SENTRY_DSN;
    const previousStore = globalThis.__UNVEILED_ENV__;
    delete process.env.SENTRY_DSN;
    globalThis.__UNVEILED_ENV__ = {};
    try {
      expect(buildSentryOptions({})).toEqual({ enabled: false });
      expect(buildSentryOptions(null)).toEqual({ enabled: false });
    } finally {
      globalThis.__UNVEILED_ENV__ = previousStore;
      if (previous === undefined) {
        delete process.env.SENTRY_DSN;
      } else {
        process.env.SENTRY_DSN = previous;
      }
    }
  });

  test("enables PII-free Sentry when DSN is set on env bindings", () => {
    const previous = process.env.SENTRY_DSN;
    const previousStore = globalThis.__UNVEILED_ENV__;
    delete process.env.SENTRY_DSN;
    globalThis.__UNVEILED_ENV__ = {};
    try {
      expect(buildSentryOptions({ SENTRY_DSN: "https://example@sentry.io/1" })).toEqual({
        dsn: "https://example@sentry.io/1",
        enabled: true,
        sendDefaultPii: false,
        tracesSampleRate: 0,
      });
    } finally {
      globalThis.__UNVEILED_ENV__ = previousStore;
      if (previous === undefined) {
        delete process.env.SENTRY_DSN;
      } else {
        process.env.SENTRY_DSN = previous;
      }
    }
  });
});
