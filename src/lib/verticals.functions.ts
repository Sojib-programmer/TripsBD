import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { publicClient } from "./supabase-public";

export const listAirports = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("airports")
    .select("iata, name, city, country")
    .order("sort_order");
  return data ?? [];
});

export const searchFlights = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        from: z.string().default("DAC"),
        to: z.string().default("CXB"),
        cabin: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("flights")
      .select("*")
      .eq("from_iata", data.from.toUpperCase())
      .eq("to_iata", data.to.toUpperCase());
    if (data.cabin && data.cabin !== "any") {
      q = q.eq("cabin", data.cabin as "economy" | "premium" | "business" | "first");
    }
    const { data: rows } = await q.order("depart_time");
    return rows ?? [];
  });

export const getFlight = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row } = await publicClient()
      .from("flights")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    return row;
  });

export const listActivities = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ city: z.string().optional(), category: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = publicClient()
      .from("activities")
      .select(
        "id, slug, title, category, city, summary, hero_url, duration_min, price_bdt, rating, review_count",
      );
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.category && data.category !== "all") q = q.eq("category", data.category);
    const { data: rows } = await q.order("rating", { ascending: false });
    return rows ?? [];
  });

export const getActivity = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: activity } = await sb
      .from("activities")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!activity) return null;
    const { data: slots } = await sb
      .from("activity_slots")
      .select("id, start_time, seats, price_bdt")
      .eq("activity_id", activity.id)
      .order("start_time");
    return { activity, slots: slots ?? [] };
  });

export const listTransfers = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ airport: z.string().default("DAC") }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { data: rows } = await publicClient()
      .from("transfers")
      .select("*")
      .eq("airport_iata", data.airport.toUpperCase())
      .order("price_bdt");
    return rows ?? [];
  });

export const listCars = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ city: z.string().default("Dhaka") }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { data: rows } = await publicClient()
      .from("car_rentals")
      .select("*")
      .eq("city", data.city)
      .order("price_per_day_bdt");
    return rows ?? [];
  });

export const listEsimPlans = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ country: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = publicClient().from("esim_plans").select("*");
    if (data.country && data.country !== "all") q = q.eq("country", data.country);
    const { data: rows } = await q.order("price_bdt");
    return rows ?? [];
  });

export const listTrains = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ from: z.string().default("Dhaka"), to: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = publicClient().from("trains").select("*").eq("from_city", data.from);
    if (data.to && data.to !== "all") q = q.eq("to_city", data.to);
    const { data: rows } = await q.order("depart_time");
    return rows ?? [];
  });

export const listTrainCities = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("trains").select("from_city, to_city");
  const from = new Set<string>();
  const to = new Set<string>();
  for (const r of data ?? []) {
    from.add(r.from_city);
    to.add(r.to_city);
  }
  return { from: [...from].sort(), to: [...to].sort() };
});

export const listPackages = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("packages")
    .select(
      "id, slug, title, from_iata, to_iata, nights, hero_url, summary, bundle_price_bdt, separate_price_bdt, saving_pct, listing:listings(slug, title, city, rating, hero_url)",
    )
    .order("saving_pct", { ascending: false });
  return data ?? [];
});
