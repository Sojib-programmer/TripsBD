/**
 * Crash / error monitoring (Play release gate 9).
 *
 * Sentry is initialised only when `VITE_SENTRY_DSN` is set, so previews and local
 * dev stay silent. Events are tagged with the release name that matches
 * `appVersionName` in `android/twa-manifest.json`, so a crash in the Play
 * pre-launch report can be traced back to the exact TWA build.
 *
 * PII rule (Data Safety, docs/play-store.md §2): we declare crash logs as
 * diagnostics only. `sendDefaultPii` stays off and `scrubEvent` strips emails,
 * phone numbers and bearer tokens out of messages, breadcrumbs and URLs before
 * anything leaves the device.
 */
import * as Sentry from "@sentry/react";

/** Must stay in sync with `appVersionName` in android/twa-manifest.json. */
export const APP_RELEASE = import.meta.env["VITE_APP_VERSION"] ?? "1.0.0";

const DSN = import.meta.env["VITE_SENTRY_DSN"] as string | undefined;

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /\+?\d[\d\s\-()]{7,}\d/g;
const TOKEN = /(bearer\s+|(?:access|refresh|api)[-_]?(?:token|key)["'=:\s]+)[\w.\-]{8,}/gi;

/** Remove anything that could identify a traveller from a free-text field. */
export function scrubText(value: string): string {
  return value.replace(EMAIL, "[email]").replace(TOKEN, "$1[redacted]").replace(PHONE, "[phone]");
}

function scrubDeep<T>(value: T, depth = 0): T {
  if (depth > 6 || value == null) return value;
  if (typeof value === "string") return scrubText(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, depth + 1)) as unknown as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubDeep(v, depth + 1);
    }
    return out as unknown as T;
  }
  return value;
}

export function initMonitoring(): void {
  if (!DSN || typeof window === "undefined") return;
  if (Sentry.getClient()) return;

  Sentry.init({
    dsn: DSN,
    release: `trips-bd@${APP_RELEASE}`,
    environment: import.meta.env.PROD ? "production" : "development",
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend: (event) => scrubDeep(event),
    beforeBreadcrumb: (breadcrumb) => scrubDeep(breadcrumb),
  });
}

/** Report a caught error with context. Safe to call when monitoring is off. */
export function captureError(error: unknown, context?: Record<string, string>): void {
  if (!DSN || !Sentry.getClient()) return;
  Sentry.captureException(error, context ? { tags: scrubDeep(context) } : undefined);
}

/**
 * Smoke test for gate 9: call from the browser console on a published build and
 * confirm the event lands in Sentry tagged `trips-bd@<version>`.
 */
export function monitoringSmokeTest(): boolean {
  if (!DSN || !Sentry.getClient()) return false;
  Sentry.captureMessage("trips-bd monitoring smoke test", "info");
  return true;
}
