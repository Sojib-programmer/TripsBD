import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Raised when deletion cannot run safely because server config is missing. Never carries the secret. */
export class DeletionConfigError extends Error {
  constructor() {
    super("Account deletion is temporarily unavailable. Please try again later.");
    this.name = "DeletionConfigError";
  }
}

/** Fail closed: a missing/short salt would make pseudonyms predictable and linkable. */
export function deletionSalt(): string {
  const salt = process.env["DELETION_PSEUDONYM_SALT"];
  if (!salt || salt.length < 32) throw new DeletionConfigError();
  return salt;
}

/** Stable, non-reversible pseudonym for audit/financial retention. */
export async function pseudonym(value: string, salt = deletionSalt()): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export type DeletionOutcome = {
  ok: true;
  deleted: Record<string, number>;
  retained: number;
};

function must<T extends { error: { message: string } | null }>(step: string, r: T): T {
  if (r.error) throw new Error(`Deletion step failed (${step}); account not deleted.`);
  return r;
}

/**
 * Fulfils a Play-policy account deletion. Order: validate config → archive
 * pseudonymised amounts → delete personal rows → delete auth user (cascades
 * payment_records and any remaining user-scoped rows) → audit → mark request done.
 * Any failure throws; success is never reported for a partial deletion.
 */
export async function fulfilAccountDeletion(
  userId: string,
  email: string,
  requestId?: string | null,
): Promise<DeletionOutcome> {
  const salt = deletionSalt();
  const userRef = await pseudonym(userId, salt);
  const emailHash = await pseudonym(email.toLowerCase(), salt);

  const [ordersR, bookingsR] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("reference, vertical, total_bdt, status, starts_at")
      .eq("user_id", userId),
    supabaseAdmin
      .from("bookings")
      .select("reference, total_bdt, status, check_in")
      .eq("user_id", userId),
  ]);
  const orders = must("read orders", ordersR).data ?? [];
  const bookings = must("read bookings", bookingsR).data ?? [];

  const archive = [
    ...orders.map((o) => ({
      user_ref: userRef,
      source: "orders",
      reference: o.reference,
      vertical: o.vertical,
      total_bdt: o.total_bdt,
      status: o.status,
      starts_at: o.starts_at,
    })),
    ...bookings.map((b) => ({
      user_ref: userRef,
      source: "bookings",
      reference: b.reference,
      vertical: "stay",
      total_bdt: b.total_bdt,
      status: b.status,
      starts_at: b.check_in ? new Date(b.check_in).toISOString() : null,
    })),
  ];

  if (archive.length > 0)
    must("archive", await supabaseAdmin.from("retained_financial_records").insert(archive));

  const deleted: Record<string, number> = { orders: orders.length, bookings: bookings.length };

  for (const table of [
    "saved_listings",
    "notifications",
    "user_roles",
    "support_messages",
  ] as const) {
    const r = must(
      `delete ${table}`,
      await supabaseAdmin.from(table).delete({ count: "exact" }).eq("user_id", userId),
    );
    deleted[table] = r.count ?? 0;
  }

  const prof = must(
    "delete profile",
    await supabaseAdmin.from("profiles").delete({ count: "exact" }).eq("id", userId),
  );
  deleted["profiles"] = prof.count ?? 0;

  must("delete auth user", await supabaseAdmin.auth.admin.deleteUser(userId));

  must(
    "audit",
    await supabaseAdmin.from("deletion_audit").insert({
      request_id: requestId ?? null,
      user_ref: userRef,
      email_hash: emailHash,
      deleted_counts: deleted,
      retained_note:
        "Pseudonymised booking/order amounts retained 6 years for accounting. Payment records (EPS IDs) deleted with the account.",
    }),
  );

  if (requestId)
    must(
      "complete request",
      await supabaseAdmin
        .from("deletion_requests")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", requestId),
    );

  return { ok: true, deleted, retained: archive.length };
}
