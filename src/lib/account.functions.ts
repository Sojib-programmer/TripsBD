import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("id, full_name, avatar_url, phone, vip_tier")
      .eq("id", context.userId)
      .maybeSingle();
    return data;
  });

export const getMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        "id, reference, check_in, check_out, guests, nights, total_bdt, status, created_at, listing:listings(slug, title, city, hero_url)",
      )
      .order("check_in", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getBookingTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ bookingId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: rows } = await context.supabase
      .from("booking_events")
      .select("id, status, message, created_at")
      .eq("booking_id", data.bookingId)
      .order("created_at", { ascending: true });
    return rows ?? [];
  });

export const getMySaved = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("saved_listings")
      .select(
        "id, listing_id, listing:listings(id, slug, title, city, country, hero_url, price_bdt, rating, review_count, is_guest_favorite)",
      )
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const toggleSaved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ listingId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("saved_listings")
      .select("id")
      .eq("listing_id", data.listingId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing) {
      await context.supabase.from("saved_listings").delete().eq("id", existing.id);
      return { saved: false };
    }
    const { error } = await context.supabase
      .from("saved_listings")
      .insert({ listing_id: data.listingId, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { saved: true };
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        listingId: z.string().uuid(),
        checkIn: z.string(),
        checkOut: z.string(),
        guests: z.number().int().min(1).max(20),
        guestName: z.string().min(2),
        guestEmail: z.string().email(),
        guestPhone: z.string().optional(),
        note: z.string().optional(),
        dealCode: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, price_bdt")
      .eq("id", data.listingId)
      .maybeSingle();
    if (listingError || !listing) throw new Error("Listing not found");

    const nights = Math.max(
      1,
      Math.round(
        (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 86_400_000,
      ),
    );

    let discountPct = 0;
    if (data.dealCode) {
      const { data: deal } = await supabase
        .from("deals")
        .select("discount_pct")
        .eq("code", data.dealCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      discountPct = deal?.discount_pct ?? 0;
    }

    const gross = listing.price_bdt * nights;
    const total = Math.round(gross * (1 - discountPct / 100));

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        listing_id: listing.id,
        check_in: data.checkIn,
        check_out: data.checkOut,
        guests: data.guests,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        guest_phone: data.guestPhone ?? null,
        note: data.note ?? null,
        nights,
        total_bdt: total,
        deal_code: data.dealCode ? data.dealCode.toUpperCase() : null,
      })
      .select("id, reference, total_bdt, nights, status")
      .single();
    if (error) throw new Error(error.message);
    return booking;
  });
