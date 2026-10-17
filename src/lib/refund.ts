/**
 * Manual EPS refund recording. EPS has no verified refund API in this integration:
 * staff issue the refund in the EPS merchant portal, then record it here.
 * Pure orchestration over an injected adapter so every step is unit-testable.
 */

export const REFUND_REF_RE = /^[A-Za-z0-9][A-Za-z0-9._\-/]{2,79}$/;
export const ORDER_REF_RE = /^[A-Za-z0-9][A-Za-z0-9\-]{2,39}$/;
export const REFUND_NOTICE_TITLE = "Payment refunded";

export type RefundKind = "booking" | "order";

export type PaymentRow = {
  id: string;
  user_id: string;
  amount_bdt: number;
  status: string;
  gateway_response: Record<string, unknown> | null;
};

type Err = { message: string } | null;

export interface RefundAdapter {
  getPayment(kind: RefundKind, reference: string): Promise<{ data: PaymentRow | null; error: Err }>;
  /** Conditional update: only rows still `paid`. Returns number of rows changed. */
  markRefunded(
    id: string,
    gateway: Record<string, unknown>,
  ): Promise<{ count: number; error: Err }>;
  getEntity(
    kind: RefundKind,
    reference: string,
  ): Promise<{ data: { id: string; status: string } | null; error: Err }>;
  cancelEntity(kind: RefundKind, id: string): Promise<{ error: Err }>;
  insertEvent(kind: RefundKind, id: string, message: string): Promise<{ error: Err }>;
  hasNotice(userId: string, reference: string): Promise<{ exists: boolean; error: Err }>;
  insertNotice(userId: string, reference: string, body: string): Promise<{ error: Err }>;
}

export type RefundSteps = {
  payment: "recorded" | "already_recorded";
  cancelled: "done" | "already" | "failed";
  event: "done" | "skipped" | "failed";
  notified: "done" | "already" | "failed";
};

export type RefundResult = { complete: boolean; steps: RefundSteps; errors: string[] };

export class RefundError extends Error {}

export async function recordRefundSteps(
  db: RefundAdapter,
  input: {
    kind: RefundKind;
    reference: string;
    refundReference: string;
    staffId: string;
    confirmedIssued: boolean;
  },
): Promise<RefundResult> {
  if (!input.confirmedIssued)
    throw new RefundError("Confirm the refund was already issued in the EPS merchant portal.");
  if (!ORDER_REF_RE.test(input.reference)) throw new RefundError("Invalid booking reference.");
  if (!REFUND_REF_RE.test(input.refundReference))
    throw new RefundError("Enter the EPS refund reference (3–80 letters, digits, . _ - /).");

  const { data: rec, error: getErr } = await db.getPayment(input.kind, input.reference);
  if (getErr) throw new RefundError("Could not load the payment. Try again.");
  if (!rec) throw new RefundError("No paid payment found for this reference.");

  const gw = (rec.gateway_response ?? {}) as Record<string, unknown>;
  let paymentStep: RefundSteps["payment"];
  let refundRef = input.refundReference;

  if (rec.status === "refunded") {
    const prev = (gw["refund"] ?? {}) as { reference?: string };
    if (prev.reference && prev.reference !== input.refundReference)
      throw new RefundError(
        `This payment is already recorded as refunded with reference ${prev.reference}.`,
      );
    refundRef = prev.reference ?? input.refundReference;
    paymentStep = "already_recorded";
  } else if (rec.status === "paid") {
    const { count, error } = await db.markRefunded(rec.id, {
      ...gw,
      refund: { reference: input.refundReference, by: input.staffId, at: new Date().toISOString() },
    });
    if (error) throw new RefundError("Refund could not be saved on the payment. Nothing changed.");
    if (count !== 1)
      throw new RefundError("Payment changed while saving (already refunded?). Reload and retry.");
    paymentStep = "recorded";
  } else {
    throw new RefundError("Only paid payments can be refunded.");
  }

  const errors: string[] = [];
  const steps: RefundSteps = {
    payment: paymentStep,
    cancelled: "failed",
    event: "skipped",
    notified: "failed",
  };
  const message = `BDT ${rec.amount_bdt} refunded via EPS (ref ${refundRef}).`;

  const { data: ent, error: entErr } = await db.getEntity(input.kind, input.reference);
  if (entErr || !ent) {
    errors.push("Could not load the booking to cancel it.");
  } else if (ent.status === "cancelled") {
    steps.cancelled = "already";
  } else {
    const { error } = await db.cancelEntity(input.kind, ent.id);
    if (error) errors.push("Booking could not be cancelled.");
    else {
      steps.cancelled = "done";
      const ev = await db.insertEvent(input.kind, ent.id, message);
      steps.event = ev.error ? "failed" : "done";
      if (ev.error) errors.push("Status event could not be logged.");
    }
  }

  const has = await db.hasNotice(rec.user_id, input.reference);
  if (has.error) errors.push("Could not check customer notification.");
  else if (has.exists) steps.notified = "already";
  else {
    const n = await db.insertNotice(
      rec.user_id,
      input.reference,
      `${message} Reference ${input.reference}. Timing to your account depends on EPS and your provider.`,
    );
    if (n.error) errors.push("Customer notification could not be sent.");
    else steps.notified = "done";
  }

  const complete =
    steps.cancelled !== "failed" && steps.notified !== "failed" && steps.event !== "failed";
  return { complete, steps, errors };
}
