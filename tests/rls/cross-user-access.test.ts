/**
 * RLS negative tests — cross-user access.
 *
 * Requires two throwaway accounts in the target Supabase project. Set
 * RLS_TEST_USER_A_EMAIL / RLS_TEST_USER_A_PASSWORD and the _B_ pair to run them;
 * the suite skips (loudly) when they are absent so CI stays deterministic.
 *
 * Release gate 11 (docs/launch-gates.md).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];
const a = {
  email: process.env["RLS_TEST_USER_A_EMAIL"],
  password: process.env["RLS_TEST_USER_A_PASSWORD"],
};
const b = {
  email: process.env["RLS_TEST_USER_B_EMAIL"],
  password: process.env["RLS_TEST_USER_B_PASSWORD"],
};

const missing = !url || !key || !a.email || !a.password || !b.email || !b.password;

function client(): SupabaseClient {
  return createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key!);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

describe.skipIf(missing)("cross-user RLS", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let userIdA = "";

  beforeAll(async () => {
    clientA = client();
    clientB = client();
    const signInA = await clientA.auth.signInWithPassword({
      email: a.email!,
      password: a.password!,
    });
    if (signInA.error) throw signInA.error;
    userIdA = signInA.data.user!.id;
    const signInB = await clientB.auth.signInWithPassword({
      email: b.email!,
      password: b.password!,
    });
    if (signInB.error) throw signInB.error;
  });

  it("user B cannot read user A's orders", async () => {
    const { data, error } = await clientB.from("orders").select("id").eq("user_id", userIdA);
    if (!error) expect(data ?? []).toHaveLength(0);
  });

  it("user B cannot read user A's bookings", async () => {
    const { data, error } = await clientB.from("bookings").select("id").eq("user_id", userIdA);
    if (!error) expect(data ?? []).toHaveLength(0);
  });

  it("user B cannot read user A's saved listings or notifications", async () => {
    for (const table of ["saved_listings", "notifications"] as const) {
      const { data, error } = await clientB.from(table).select("id").eq("user_id", userIdA);
      if (!error) expect(data ?? []).toHaveLength(0);
    }
  });

  it("user B cannot create an order owned by user A", async () => {
    const { error } = await clientB
      .from("orders")
      .insert({ user_id: userIdA, vertical: "stay", status: "requested" } as never);
    expect(error).not.toBeNull();
  });

  it("user B cannot grant themselves a role", async () => {
    const { data } = await clientB.auth.getUser();
    const { error } = await clientB
      .from("user_roles")
      .insert({ user_id: data.user!.id, role: "admin" } as never);
    expect(error).not.toBeNull();
  });

  it("user A can read their own orders", async () => {
    const { error } = await clientA.from("orders").select("id").eq("user_id", userIdA).limit(1);
    expect(error).toBeNull();
  });
});
