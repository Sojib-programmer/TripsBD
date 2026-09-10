/**
 * RLS negative tests — anonymous (signed-out) access.
 *
 * These run against the project's Data API with the publishable anon key only.
 * Every private table must refuse anonymous reads and writes; public catalogue
 * tables must stay readable so the marketing surface keeps working.
 *
 * Release gate 11 (docs/launch-gates.md).
 */
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
const key =
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];

const missingEnv = !url || !key;

const anon = missingEnv
  ? null
  : createClient(url!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          headers.set("apikey", key!);
          if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          return fetch(input, { ...init, headers });
        },
      },
    });

/** Tables that must never be readable or writable by a signed-out visitor. */
const PRIVATE_TABLES = [
  "profiles",
  "orders",
  "order_events",
  "bookings",
  "booking_events",
  "saved_listings",
  "notifications",
  "support_messages",
  "user_roles",
  "deletion_requests",
  "deletion_audit",
  "retained_financial_records",
] as const;

/** Catalogue tables that are intentionally world-readable. */
const PUBLIC_TABLES = ["destinations", "listings", "activities", "flights", "airports"] as const;

describe.skipIf(missingEnv)("anonymous RLS", () => {
  beforeAll(() => {
    if (missingEnv) throw new Error("Supabase env missing");
  });

  it.each(PRIVATE_TABLES)("denies anonymous SELECT on %s", async (table) => {
    const { data, error } = await anon!.from(table).select("*").limit(1);
    // Either an explicit permission error, or RLS filters every row away.
    if (!error) expect(data ?? []).toHaveLength(0);
  });

  it.each(PRIVATE_TABLES)("denies anonymous INSERT on %s", async (table) => {
    const { error } = await anon!.from(table).insert({} as never);
    expect(error).not.toBeNull();
  });

  it.each(PRIVATE_TABLES)("denies anonymous DELETE on %s", async (table) => {
    const { data, error } = await anon!
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id");
    if (!error) expect(data ?? []).toHaveLength(0);
  });

  it("cannot escalate privileges through user_roles", async () => {
    const { error } = await anon!
      .from("user_roles")
      .insert({ user_id: "00000000-0000-0000-0000-000000000000", role: "admin" } as never);
    expect(error).not.toBeNull();
  });

  it.each(PUBLIC_TABLES)("still allows anonymous SELECT on %s", async (table) => {
    const { error } = await anon!.from(table).select("id").limit(1);
    expect(error).toBeNull();
  });
});
