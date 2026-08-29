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
