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
    const { data: order, error } = await context.supabase
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
        total_bdt: data.totalBdt,
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
