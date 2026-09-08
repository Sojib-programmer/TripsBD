import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const refInput = z.object({ reference: z.string().trim().min(3).max(40) });

/**
 * Traveller-initiated cancellation. The database triggers only allow a traveller to move a
 * row to `cancelled`, so this cannot be used to fake a confirmation or change any amount.
 */
export const cancelMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => refInput.parse(data))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("reference", data.reference)
      .eq("user_id", context.userId)
      .in("status", ["pending", "confirmed"])
      .select("reference, status")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("This request can no longer be cancelled in the app.");
    return row;
  });

export const cancelMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => refInput.parse(data))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("reference", data.reference)
      .eq("user_id", context.userId)
      .in("status", ["pending", "confirmed"])
      .select("reference, status")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("This request can no longer be cancelled in the app.");
    return row;
  });
