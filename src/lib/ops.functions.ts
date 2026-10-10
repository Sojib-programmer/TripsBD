import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Ctx = { supabase: SupabaseClient<Database>; userId: string };

/** Staff = admin or ops role. Read through the caller's own role rows (RLS: select own). */
export async function isStaff({ supabase, userId }: Ctx) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "ops"]);
  return (data ?? []).length > 0;
}

async function assertStaff(ctx: Ctx) {
  if (!(await isStaff(ctx))) throw new Error("Forbidden: staff only");
}

export const getStaffStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ staff: await isStaff(context) }));

export const listPendingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const sb = context.supabase;
    const [bookings, orders] = await Promise.all([
      sb
        .from("bookings")
        .select(
          "id, reference, check_in, check_out, guests, guest_name, guest_email, guest_phone, total_bdt, note, created_at, listing:listings(title, city)",
        )
        .eq("status", "pending")
        .order("created_at"),
      sb
        .from("orders")
        .select(
          "id, reference, vertical, title, subtitle, starts_at, travellers, contact_name, contact_email, contact_phone, total_bdt, created_at",
        )
        .eq("status", "pending")
        .order("created_at"),
    ]);
    return { bookings: bookings.data ?? [], orders: orders.data ?? [] };
  });

/** Recently confirmed requests with their payment status, so staff see who has paid. */
export const listConfirmedWithPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const sb = context.supabase;
    const [bookings, orders] = await Promise.all([
      sb
        .from("bookings")
        .select("reference, total_bdt, guest_name, updated_at, listing:listings(title)")
        .eq("status", "confirmed")
        .order("updated_at", { ascending: false })
        .limit(25),
      sb
        .from("orders")
        .select("reference, total_bdt, contact_name, title, vertical, updated_at")
        .eq("status", "confirmed")
        .order("updated_at", { ascending: false })
        .limit(25),
    ]);
    const items = [
      ...(bookings.data ?? []).map((b) => ({
        kind: "booking" as const,
        reference: b.reference,
        title: b.listing?.title ?? "Stay",
        who: b.guest_name,
        total: b.total_bdt,
        updated_at: b.updated_at,
      })),
      ...(orders.data ?? []).map((o) => ({
        kind: "order" as const,
        reference: o.reference,
        title: `${o.vertical}: ${o.title}`,
        who: o.contact_name,
        total: o.total_bdt,
        updated_at: o.updated_at,
      })),
    ].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    const refs = items.map((i) => i.reference);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pays } = refs.length
      ? await supabaseAdmin
          .from("payment_records")
          .select("reference, kind, status, eps_transaction_id, payment_method")
          .in("reference", refs)
          .in("status", ["paid", "refunded"])
      : { data: [] };
    return items.map((i) => {
      const p = (pays ?? []).find((x) => x.reference === i.reference && x.kind === i.kind);
      return {
        ...i,
        paid: p
          ? {
              eps_transaction_id: p.eps_transaction_id,
              method: p.payment_method,
              refunded: p.status === "refunded",
            }
          : null,
      };
    });
  });

const decisionSchema = z.object({
  kind: z.enum(["booking", "order"]),
  id: z.string().uuid(),
  decision: z.enum(["confirmed", "cancelled"]),
  message: z.string().trim().max(500).optional(),
});

/**
 * Human confirmation step. Only staff can move a request out of `pending`;
 * the DB trigger also rejects non-staff status changes other than cancel.
 */
export const decideRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => decisionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const table = data.kind === "booking" ? "bookings" : "orders";
    const { data: row, error } = await context.supabase
      .from(table)
      .update({ status: data.decision })
      .eq("id", data.id)
      .eq("status", "pending")
      .select("id, reference, user_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request is no longer pending");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const confirmed = data.decision === "confirmed";
    const msg =
      data.message ||
      (confirmed
        ? "Confirmed by the Trips.bd reservations team. Your voucher is ready."
        : "We couldn't secure this request. No charge was made.");

    if (data.kind === "booking") {
      // Trigger logged a generic event; add the human-readable one.
      await supabaseAdmin
        .from("booking_events")
        .insert({ booking_id: row.id, status: data.decision, message: msg });
      // Orders already notify via trigger; bookings do not.
      await supabaseAdmin.from("notifications").insert({
        user_id: row.user_id,
        title: confirmed ? "Booking confirmed" : "Booking request declined",
        body: `${msg} Reference ${row.reference}.`,
        order_reference: row.reference,
      });
    } else {
      await supabaseAdmin
        .from("order_events")
        .insert({ order_id: row.id, status: data.decision, message: msg });
    }
    return { reference: row.reference, status: data.decision };
  });

async function assertAdmin({ supabase, userId }: Ctx) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (!(data ?? []).length) throw new Error("Forbidden: admin only");
}

/**
 * Staff records a refund that was issued in the EPS merchant panel.
 * EPS publishes no verified refund API in its SDK, so we never claim to reverse
 * money automatically: staff must paste the EPS refund reference.
 */
export const recordRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["booking", "order"]),
        reference: z.string().trim().min(3).max(40),
        refundReference: z.string().trim().min(3).max(80),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rec } = await supabaseAdmin
      .from("payment_records")
      .select("id, user_id, amount_bdt, gateway_response")
      .eq("kind", data.kind)
      .eq("reference", data.reference)
      .eq("status", "paid")
      .maybeSingle();
    if (!rec) throw new Error("No paid payment found for this reference");
    const gw = (rec.gateway_response ?? {}) as Record<string, unknown>;
    const { error } = await supabaseAdmin
      .from("payment_records")
      .update({
        status: "refunded",
        gateway_response: {
          ...gw,
          refund: {
            reference: data.refundReference,
            by: context.userId,
            at: new Date().toISOString(),
          },
        } as never,
      })
      .eq("id", rec.id)
      .eq("status", "paid");
    if (error) {
      console.error("refund update failed", error);
      throw new Error(
        "Refund could not be saved. The database must allow the 'refunded' payment status first.",
      );
    }
    const table = data.kind === "booking" ? "bookings" : "orders";
    await supabaseAdmin.from(table).update({ status: "cancelled" }).eq("reference", data.reference);
    await supabaseAdmin.from("notifications").insert({
      user_id: rec.user_id,
      title: "Payment refunded",
      body: `BDT ${rec.amount_bdt} for ${data.reference} has been refunded via EPS (ref ${data.refundReference}).`,
      order_reference: data.reference,
    });
    return { ok: true };
  });

export const listStaffMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "ops"]);
    const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
    const { data: profs } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ids)
      : { data: [] };
    return ids.map((id) => {
      const p = (profs ?? []).find((x) => x.id === id);
      return {
        userId: id,
        email: p?.email ?? null,
        name: p?.full_name ?? null,
        roles: (roles ?? []).filter((r) => r.user_id === id).map((r) => r.role),
      };
    });
  });

/** Admin grants/revokes ops or admin for an existing account (looked up by email). */
export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        role: z.enum(["ops", "admin"]),
        grant: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (!prof)
      throw new Error("No account with that email. Ask them to sign up at app.trips.bd first.");
    if (!data.grant && prof.id === context.userId && data.role === "admin")
      throw new Error("You can't remove your own admin role");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: prof.id, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", prof.id).eq("role", data.role);
    }
    return { ok: true };
  });
