/**
 * Crash diagnostics must not carry traveller PII (Data Safety, docs/play-store.md §2).
 */
import { describe, expect, it } from "vitest";

import { scrubText } from "../../src/lib/monitoring";

describe("scrubText", () => {
  it("removes email addresses", () => {
    expect(scrubText("failed for rafi.hasan+test@trips.bd")).toBe("failed for [email]");
  });

  it("removes phone numbers", () => {
    expect(scrubText("contact +8801540723530 now")).toBe("contact [phone] now");
  });

  it("removes bearer tokens and api keys", () => {
    expect(scrubText("Authorization: Bearer sb_publishable_abcdef123456")).toContain("[redacted]");
    expect(scrubText("access_token: eyJhbGciOiJIUzI1NiJ9")).toContain("[redacted]");
  });

  it("leaves ordinary diagnostics intact", () => {
    const msg = "TypeError: Cannot read properties of undefined (reading 'status')";
    expect(scrubText(msg)).toBe(msg);
  });
});
