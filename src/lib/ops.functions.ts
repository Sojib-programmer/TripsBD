import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

/** Staff = admin or ops role. Read through the caller's own role rows (RLS: select own). */
async function isStaff({ supabase, userId }: Ctx) {
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
