import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns the Intercom Identity Verification HMAC for the *authenticated* caller.
 * The secret never leaves the server; the digest is scoped to context.userId only,
 * so a client cannot request a hash for somebody else's account.
 */
export const getIntercomIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secret = process.env["INTERCOM_IDENTITY_VERIFICATION_SECRET"];
    if (!secret) return { userHash: null as string | null };

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(context.userId),
    );
    const userHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return { userHash };
  });
