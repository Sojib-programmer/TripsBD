import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isStaff } from "@/lib/ops.functions";

const refSchema = z.object({
  kind: z.enum(["booking", "order"]),
  reference: z.string().trim().min(3).max(40),
});

/** Payment state for one booking/order, visible to its owner (RLS). */
export const getPaymentState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => refSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { epsEnv } = await import("./eps.server");
    const { data: rows } = await context.supabase
      .from("payment_records")
      .select("status, amount_bdt, payment_method, eps_transaction_id, updated_at")
      .eq("reference", data.reference)
      .eq("kind", data.kind)
      .order("created_at", { ascending: false })
      .limit(5);
    const paid = (rows ?? []).find((r) => r.status === "paid") ?? null;
    const enabled = epsEnv() !== null;
    // Test mode: only while live EPS isn't configured, and only for staff accounts.
    const testMode = !enabled && (await isStaff(context));
    return { enabled, testMode, paid, last: rows?.[0] ?? null };
  });

const testSchema = refSchema.extend({
  outcome: z.enum(["success", "fail"]),
  method: z.enum(["bKash", "Nagad", "Rocket", "Card"]),
});

/**
 * Staff-only simulated EPS payment, used to test the full voucher flow before
 * real EPS credentials exist. Disabled as soon as live EPS is configured.
 * Records are clearly marked TEST so they can never pass for real money.
 */
export const simulateTestPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => testSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { epsEnv, newMerchantTransactionId } = await import("./eps.server");
    if (epsEnv()) throw new Error("Test payments are off because live EPS is configured.");
    if (!(await isStaff(context))) throw new Error("Test payments are for staff accounts only.");

    const sb = context.supabase;
    const table = data.kind === "booking" ? "bookings" : "orders";
    const { data: row } = await sb
      .from(table)
      .select("id, total_bdt, status")
      .eq("reference", data.reference)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!row) throw new Error("Not found on your account.");
    if (row.status !== "confirmed") throw new Error("Confirm it on the Reservations desk first.");
    if (row.total_bdt <= 0) throw new Error("This booking has no amount to pay.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: already } = await supabaseAdmin
      .from("payment_records")
      .select("id")
      .eq("reference", data.reference)
      .eq("kind", data.kind)
      .eq("status", "paid")
      .maybeSingle();
    if (already) throw new Error("This booking is already paid.");

    const tx = newMerchantTransactionId();
    const success = data.outcome === "success";
    const { error } = await supabaseAdmin.from("payment_records").insert({
      user_id: context.userId,
      kind: data.kind,
      reference: data.reference,
      merchant_transaction_id: tx,
      eps_transaction_id: success ? `TEST-${tx}` : null,
      amount_bdt: row.total_bdt,
      status: success ? "paid" : "failed",
      payment_method: `TEST · ${data.method}`,
      gateway_response: { test: true, outcome: data.outcome } as never,
    });
    if (error) throw new Error("Could not record the test payment.");

    if (success) {
      const message = `TEST payment of BDT ${row.total_bdt} via ${data.method} (no real money).`;
      if (data.kind === "booking")
        await supabaseAdmin
          .from("booking_events")
          .insert({ booking_id: row.id, status: "confirmed", message });
      else
        await supabaseAdmin
          .from("order_events")
          .insert({ order_id: row.id, status: "confirmed", message });
      await supabaseAdmin.from("notifications").insert({
        user_id: context.userId,
        title: "Payment received (test)",
        body: `${message} Reference ${data.reference}.`,
        order_reference: data.reference,
      });
    }
    return { status: success ? "paid" : "failed" };
  });

/**
 * Starts an EPS checkout. Amount is read from the DB (never from the client),
 * and only confirmed, unpaid requests owned by the caller can be paid.
 */
export const startEpsPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => refSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { epsEnv, epsInitialize, newMerchantTransactionId } = await import("./eps.server");
    const env = epsEnv();
    if (!env) throw new Error("Online payment is not available yet.");

    const sb = context.supabase;
    let amount = 0;
    let title = "Trips.bd booking";
    let name = "";
    let email = "";
    let phone: string | null = null;
    let status = "";

    if (data.kind === "booking") {
      const { data: b } = await sb
        .from("bookings")
        .select("total_bdt, status, guest_name, guest_email, guest_phone, listing:listings(title)")
        .eq("reference", data.reference)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (!b) throw new Error("Booking not found");
      amount = b.total_bdt;
      status = b.status;
      name = b.guest_name;
      email = b.guest_email;
      phone = b.guest_phone;
      title = b.listing?.title ?? title;
    } else {
      const { data: o } = await sb
        .from("orders")
        .select("total_bdt, status, title, contact_name, contact_email, contact_phone")
        .eq("reference", data.reference)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (!o) throw new Error("Order not found");
      amount = o.total_bdt;
      status = o.status;
      name = o.contact_name;
      email = o.contact_email;
      phone = o.contact_phone;
      title = o.title;
    }

    if (status !== "confirmed")
      throw new Error("You can pay once our team has confirmed this booking.");
    if (amount <= 0) throw new Error("This booking has no amount to pay.");

    if (!phone) {
      const { data: p } = await sb
        .from("profiles")
        .select("phone")
        .eq("id", context.userId)
        .maybeSingle();
      phone = p?.phone ?? null;
    }
    if (!phone) throw new Error("Add a phone number in support so we can process payment.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: already } = await supabaseAdmin
      .from("payment_records")
      .select("id")
      .eq("reference", data.reference)
      .eq("kind", data.kind)
      .eq("status", "paid")
      .maybeSingle();
    if (already) throw new Error("This booking is already paid.");

    const req = getRequest();
    const origin = process.env["APP_ORIGIN"] ?? new URL(req.url).origin;
    const tx = newMerchantTransactionId();
    const cb = (outcome: string) => `${origin}/api/public/eps/return?tx=${tx}&outcome=${outcome}`;

    const { error } = await supabaseAdmin.from("payment_records").insert({
      user_id: context.userId,
      kind: data.kind,
      reference: data.reference,
      merchant_transaction_id: tx,
      amount_bdt: amount,
      status: "initiated",
    });
    if (error) throw new Error("Could not start the payment.");

    const redirectUrl = await epsInitialize(env, {
      merchantTransactionId: tx,
      customerOrderId: data.reference,
      amount,
      successUrl: cb("success"),
      failUrl: cb("fail"),
      cancelUrl: cb("cancel"),
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      productName: title,
      ipAddress: req.headers.get("cf-connecting-ip") ?? undefined,
    });
    return { redirectUrl };
  });
