import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const verticalEnum = z.enum([
  "stay",
  "flight",
  "package",
  "activity",
  "transfer",
  "car",
  "esim",
  "train",
]);

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        vertical: verticalEnum,
        itemId: z.string().uuid().nullable().optional(),
        title: z.string().min(2),
        subtitle: z.string().optional(),
        heroUrl: z.string().optional(),
        startsAt: z.string(),
        endsAt: z.string().optional(),
        travellers: z.number().int().min(1).max(20).default(1),
        totalBdt: z.number().int().min(0),
        contactName: z.string().min(2),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    // Never trust the client total: derive it from catalog prices.
    // Unpriced requests (no catalog item) become quote requests at 0; staff quote them.
    const sb = context.supabase;
    let total = 0;
    if (data.itemId) {
      if (data.vertical === "flight") {
        const { data: f } = await sb
          .from("flights")
          .select("fare_bdt")
          .eq("id", data.itemId)
          .maybeSingle();
        if (!f) throw new Error("Flight not found");
        total = f.fare_bdt * data.travellers;
      } else if (data.vertical === "transfer") {
        const { data: t } = await sb
          .from("transfers")
          .select("price_bdt")
          .eq("id", data.itemId)
          .maybeSingle();
        if (!t) throw new Error("Transfer not found");
        total = t.price_bdt;
      } else if (data.vertical === "activity") {
        const { data: a } = await sb
          .from("activities")
          .select("price_bdt")
          .eq("id", data.itemId)
          .maybeSingle();
        if (!a) throw new Error("Activity not found");
        let unit = a.price_bdt;
        const slot = data.details?.["slot"];
        if (typeof slot === "string") {
          const { data: s } = await sb
            .from("activity_slots")
            .select("price_bdt")
            .eq("activity_id", data.itemId)
            .eq("start_time", slot)
            .maybeSingle();
          if (s) unit = s.price_bdt;
        }
        total = unit * data.travellers;
      }
    }
    const { data: order, error } = await sb
      .from("orders")
      .insert({
        user_id: context.userId,
        vertical: data.vertical,
        item_id: data.itemId ?? null,
        title: data.title,
        subtitle: data.subtitle ?? null,
        hero_url: data.heroUrl ?? null,
        starts_at: data.startsAt,
        ends_at: data.endsAt ?? null,
        travellers: data.travellers,
        total_bdt: total,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone ?? null,
        details: (data.details ?? {}) as never,
      })
      .select("id, reference, status, total_bdt")
      .single();
    if (error) throw new Error(error.message);
    return order;
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, reference, vertical, title, subtitle, hero_url, starts_at, ends_at, travellers, total_bdt, status, created_at",
      )
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getOrderByReference = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ reference: z.string().min(4) }).parse(input))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: order } = await sb
      .from("orders")
      .select("*")
      .eq("reference", data.reference.toUpperCase())
      .maybeSingle();
    if (!order) return null;
    const { data: events } = await sb
      .from("order_events")
      .select("id, status, message, created_at")
      .eq("order_id", order.id)
      .order("created_at");
    return { order, events: events ?? [] };
  });

export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications")
      .select("id, title, body, kind, order_reference, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("user_id", context.userId);
    return { ok: true };
  });
