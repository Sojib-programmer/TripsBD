import { describe, expect, it } from "vitest";
import { recordRefundSteps, RefundError, type RefundAdapter, type PaymentRow } from "../../src/lib/refund";

function db(
  over: Partial<{
    status: string;
    prevRef: string;
    entStatus: string;
    failCancel: boolean;
    notice: boolean;
  }> = {},
) {
  const state = {
    notices: over.notice ? 1 : 0,
    cancelled: over.entStatus === "cancelled",
    marked: 0,
  };
  const pay: PaymentRow = {
    id: "p",
    user_id: "u",
    amount_bdt: 10,
    status: over.status ?? "paid",
    gateway_response: over.prevRef ? { refund: { reference: over.prevRef } } : {},
  };
  const a: RefundAdapter = {
    getPayment: async () => ({ data: pay, error: null }),
    markRefunded: async () => {
      state.marked++;
      const ok = pay.status === "paid";
      pay.status = "refunded";
      return { count: ok ? 1 : 0, error: null };
    },
    getEntity: async () => ({
      data: { id: "b", status: state.cancelled ? "cancelled" : "confirmed" },
      error: null,
    }),
    cancelEntity: async () =>
      over.failCancel ? { error: { message: "x" } } : ((state.cancelled = true), { error: null }),
    insertEvent: async () => ({ error: null }),
    hasNotice: async () => ({ exists: state.notices > 0, error: null }),
    insertNotice: async () => (state.notices++, { error: null }),
  };
  return { a, state, pay };
}
const base = {
  kind: "booking" as const,
  reference: "TBD-ABC123",
  refundReference: "RF-001",
  staffId: "s",
  confirmedIssued: true,
};

describe("recordRefundSteps", () => {
  it("requires portal confirmation", async () => {
    await expect(
      recordRefundSteps(db().a, { ...base, confirmedIssued: false }),
    ).rejects.toBeInstanceOf(RefundError);
  });
  it("validates references", async () => {
    await expect(recordRefundSteps(db().a, { ...base, refundReference: "<x>" })).rejects.toThrow(
      /refund reference/,
    );
    await expect(recordRefundSteps(db().a, { ...base, reference: "a b" })).rejects.toThrow(
      /booking reference/,
    );
  });
  it("records a full refund", async () => {
    const d = db();
    const r = await recordRefundSteps(d.a, base);
    expect(r.complete).toBe(true);
    expect(d.state.notices).toBe(1);
  });
  it("rejects a second refund with a different reference", async () => {
    await expect(
      recordRefundSteps(db({ status: "refunded", prevRef: "RF-001" }).a, {
        ...base,
        refundReference: "RF-999",
      }),
    ).rejects.toThrow(/already recorded/);
  });
  it("reports partial failure, then resumes without duplicating", async () => {
    const d = db({ failCancel: true });
    const r1 = await recordRefundSteps(d.a, base);
    expect(r1.complete).toBe(false);
    expect(d.state.notices).toBe(1);
    const d2 = db({ status: "refunded", prevRef: "RF-001", notice: true });
    const r2 = await recordRefundSteps(d2.a, base);
    expect(r2.complete).toBe(true);
    expect(r2.steps.payment).toBe("already_recorded");
    expect(d2.state.marked).toBe(0);
    expect(d2.state.notices).toBe(1);
  });
});
