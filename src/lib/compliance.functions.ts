import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const deletionInput = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deletionInput.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    const email = (context.claims?.email as string | undefined) ?? "";
    const { error } = await context.supabase.from("deletion_requests").insert({
      user_id: context.userId,
      email,
      reason: data.reason ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getMyDeletionRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("deletion_requests")
      .select("id, status, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

const confirmInput = z.object({
  confirm: z.literal("DELETE"),
  reason: z.string().trim().max(1000).optional(),
});

/**
 * Immediately and irreversibly deletes the caller's account and personal data.
 * Google Play requires deletion to actually happen, not just be queued.
 */
export const deleteMyAccountNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => confirmInput.parse(data))
  .handler(async ({ context, data }) => {
    const email = (context.claims?.email as string | undefined) ?? "";

    const { data: request } = await context.supabase
      .from("deletion_requests")
      .insert({
        user_id: context.userId,
        email,
        reason: data.reason ?? null,
        status: "processing",
      })
      .select("id")
      .single();

    const { fulfilAccountDeletion } = await import("./deletion.server");
    const result = await fulfilAccountDeletion(context.userId, email, request?.id ?? null);
    return { ok: true as const, deleted: result.deleted, retained: result.retained };
  });

