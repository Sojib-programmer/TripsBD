import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const LIST_COLS =
  "id, slug, title, kind, city, country, summary, hero_url, photos, price_bdt, rating, review_count, is_guest_favorite, max_guests, destination_id";

/**
 * PostgREST parses `or=(...)` as a structured expression, so characters like
 * `,` `.` `(` `)` `:` `"` `\` `*` and `%` are operators, not literal text.
 * Interpolating raw user input lets a caller inject extra filter clauses, so
 * strip every structural character and cap the length before building a filter.
 */
function sanitizeFilterTerm(term: string): string {
  return term
    .replace(/[,.()":*%\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}


export const getHomeFeed = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [destinations, listings, deals] = await Promise.all([
    sb.from("destinations").select("id, slug, name, country, tagline, hero_url").order("sort_order"),
    sb.from("listings").select(LIST_COLS).order("rating", { ascending: false }).limit(12),
    sb.from("deals").select("id, code, title, subtitle, discount_pct").limit(6),
  ]);
  return {
    destinations: destinations.data ?? [],
    listings: listings.data ?? [],
    deals: deals.data ?? [],
  };
});

export const getDeals = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("deals")
    .select("id, code, title, subtitle, discount_pct, terms, expires_at")
    .order("discount_pct", { ascending: false });
  return data ?? [];
});

export const searchListings = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().optional(),
        destinationId: z.string().uuid().optional(),
        kind: z.enum(["hotel", "home", "apartment", "resort", "villa"]).optional(),
        guests: z.number().int().min(1).max(20).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb.from("listings").select(LIST_COLS).eq("is_published", true);
    const term = data.q ? sanitizeFilterTerm(data.q) : "";
    if (term) {
      q = q.or(`title.ilike.%${term}%,city.ilike.%${term}%,summary.ilike.%${term}%`);
    }
    if (data.destinationId) q = q.eq("destination_id", data.destinationId);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.guests) q = q.gte("max_guests", data.guests);

    const { data: rows } = await q.order("rating", { ascending: false }).limit(50);
    return rows ?? [];
  });

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row } = await sb
      .from("listings")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    return row;
  });
