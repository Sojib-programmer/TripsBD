import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Stable, non-reversible pseudonym for audit/financial retention. */
async function pseudonym(value: string): Promise<string> {
  const salt = process.env["DELETION_PSEUDONYM_SALT"] ?? "trips-bd-deletion";
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

/**
 * Fulfils a Play-policy account deletion: archives an anonymised financial record
 * for the statutory retention period, removes every personal row, then deletes the
 * auth user (which cascades the remaining user-scoped rows).
 */
export async function fulfilAccountDeletion(
  userId: string,
  email: string,
  requestId?: string | null,
): Promise<DeletionOutcome> {
  const userRef = await pseudonym(userId);
  const emailHash = await pseudonym(email.toLowerCase());

  const [{ data: orders }, { data: bookings }] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("reference, vertical, total_bdt, status, starts_at")
      .eq("user_id", userId),
    supabaseAdmin
      .from("bookings")
      .select("reference, total_bdt, status, check_in")
      .eq("user_id", userId),
  ]);

  const archive = [
    ...(orders ?? []).map((o) => ({
      user_ref: userRef,
      source: "orders",
      reference: o.reference,
      vertical: o.vertical,
      total_bdt: o.total_bdt,
      status: o.status,
      starts_at: o.starts_at,
    })),
    ...(bookings ?? []).map((b) => ({
      user_ref: userRef,
      source: "bookings",
      reference: b.reference,
      vertical: "stay",
      total_bdt: b.total_bdt,
      status: b.status,
      starts_at: b.check_in ? new Date(b.check_in).toISOString() : null,
    })),
  ];

  if (archive.length > 0) {
    const { error } = await supabaseAdmin.from("retained_financial_records").insert(archive);
    if (error) throw new Error(`Archive failed, deletion aborted: ${error.message}`);
  }

  const deleted: Record<string, number> = {
    orders: orders?.length ?? 0,
    bookings: bookings?.length ?? 0,
  };

  for (const table of ["saved_listings", "notifications", "user_roles"] as const) {
    const { count } = await supabaseAdmin
      .from(table)
      .delete({ count: "exact" })
      .eq("user_id", userId);
    deleted[table] = count ?? 0;
  }

  await supabaseAdmin.from("profiles").delete().eq("id", userId);
  deleted["profiles"] = 1;

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) throw new Error(`Auth user deletion failed: ${authError.message}`);

  await supabaseAdmin.from("deletion_audit").insert({
    request_id: requestId ?? null,
    user_ref: userRef,
    email_hash: emailHash,
    deleted_counts: deleted,
    retained_note:
      "Anonymised booking amounts retained for 6 years to meet accounting obligations. No personal identifiers retained.",
  });

  if (requestId) {
    await supabaseAdmin
      .from("deletion_requests")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId);
  }

  return { ok: true, deleted, retained: archive.length };
}
