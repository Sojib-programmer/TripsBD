import { createFileRoute } from "@tanstack/react-router";

/**
 * EPS redirects the traveller here after checkout. The query string is untrusted:
 * we only use `tx` to look up our own record, then ask EPS server-to-server
 * for the real status before marking anything paid.
 */
async function handle(request: Request) {
  const url = new URL(request.url);
  const tx = url.searchParams.get("tx") ?? "";
  const outcome = url.searchParams.get("outcome") ?? "";
  const origin = process.env["APP_ORIGIN"] ?? url.origin;
  const back = (path: string) => Response.redirect(`${origin}${path}`, 303);

  if (!/^\d{10,24}$/.test(tx)) return back("/trips");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { epsEnv, epsVerify } = await import("@/lib/eps.server");

  const { data: rec } = await supabaseAdmin
    .from("payment_records")
    .select("id, user_id, kind, reference, amount_bdt, status")
    .eq("merchant_transaction_id", tx)
    .maybeSingle();
  if (!rec) return back("/trips");
  const page = rec.kind === "booking" ? `/booking/${rec.reference}` : `/order/${rec.reference}`;
  if (rec.status === "paid") return back(page);

  const env = epsEnv();
  if (!env) return back(page);

  let v;
  try {
    v = await epsVerify(env, tx);
  } catch (e) {
    console.error("EPS verify failed", e);
    return back(page);
  }

  // Amount must match what we charged; otherwise treat as failed and log.
  const amountOk = v.amount === null || Math.round(v.amount) === rec.amount_bdt;
  const status =
    v.status === "paid" && amountOk
      ? "paid"
      : v.status === "pending"
        ? "initiated"
        : outcome === "cancel"
          ? "cancelled"
          : "failed";

  await supabaseAdmin
    .from("payment_records")
    .update({
      status,
      eps_transaction_id: v.epsTransactionId,
      payment_method: v.method,
      gateway_response: v.raw as never,
    })
    .eq("id", rec.id)
    .neq("status", "paid");

  if (status === "paid") {
    const message = `Payment of BDT ${rec.amount_bdt} received via EPS${v.method ? ` (${v.method})` : ""}.`;
    if (rec.kind === "booking") {
      const { data: b } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("reference", rec.reference)
        .maybeSingle();
      if (b)
        await supabaseAdmin
          .from("booking_events")
          .insert({ booking_id: b.id, status: "confirmed", message });
    } else {
      const { data: o } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("reference", rec.reference)
        .maybeSingle();
      if (o)
        await supabaseAdmin
          .from("order_events")
          .insert({ order_id: o.id, status: "confirmed", message });
    }
    await supabaseAdmin.from("notifications").insert({
      user_id: rec.user_id,
      title: "Payment received",
      body: `${message} Reference ${rec.reference}.`,
      order_reference: rec.reference,
    });
  } else if (!amountOk) {
    console.error("EPS amount mismatch", tx, v.amount, rec.amount_bdt);
  }

  return back(page);
}

export const Route = createFileRoute("/api/public/eps/return")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
