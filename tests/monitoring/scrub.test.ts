/**
 * Crash diagnostics must not carry traveller PII (Data Safety, docs/play-store.md §2).
 */
import { describe, expect, it } from "vitest";

import { APP_RELEASE, scrubDeep, scrubText } from "../../src/lib/monitoring";

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

describe("event payload smoke test (release gate 9)", () => {
  it("strips PII from a realistic crash event before it leaves the device", () => {
    const event = {
      message: "order failed for rafi.hasan@trips.bd",
      release: `trips-bd@${APP_RELEASE}`,
      request: {
        url: "https://app.trips.bd/order/TR-1042?email=rafi.hasan@trips.bd",
        headers: { Authorization: "Bearer sb_publishable_abcdef123456" },
      },
      breadcrumbs: [
        { category: "ui.click", message: "submitted request, phone +8801540723530" },
        { category: "fetch", data: { contact_phone: "+8801540723530" } },
      ],
      tags: { vertical: "stays" },
    };

    const serialized = JSON.stringify(scrubDeep(event));

    expect(serialized).not.toContain("rafi.hasan@trips.bd");
    expect(serialized).not.toContain("8801540723530");
    expect(serialized).not.toContain("sb_publishable_abcdef123456");
    expect(serialized).toContain("[email]");
    expect(serialized).toContain("[phone]");
    expect(serialized).toContain("[redacted]");
    // Non-PII diagnostics survive so the event stays useful.
    expect(serialized).toContain("trips-bd@");
    expect(serialized).toContain("ui.click");
    expect(serialized).toContain("stays");
  });
});
