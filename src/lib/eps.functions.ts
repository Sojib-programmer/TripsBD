import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    return { enabled: epsEnv() !== null, paid, last: rows?.[0] ?? null };
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
    const cb = (outcome: string) =>
      `${origin}/api/public/eps/return?tx=${tx}&outcome=${outcome}`;

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
