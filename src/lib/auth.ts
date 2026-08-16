/**
 * OAuth entry points for Trips.bd.
 *
 * The provider handshake runs on Lovable Cloud (Supabase Auth). Cloud is not
 * provisioned for this workspace yet, so the calls below fail loudly instead of
 * silently no-oping. Once Cloud is enabled, replace the body of `signInWith`
 * with:
 *
 *   import { supabase } from "@/integrations/supabase/client";
 *   await supabase.auth.signInWithOAuth({
 *     provider,
 *     options: { redirectTo: `${window.location.origin}/` },
 *   });
 */
export type OAuthProvider = "google" | "apple";

export class AuthUnavailableError extends Error {
  constructor() {
    super("Sign-in is not available yet — the Trips.bd account backend is not connected.");
    this.name = "AuthUnavailableError";
  }
}

export async function signInWith(_provider: OAuthProvider): Promise<never> {
  throw new AuthUnavailableError();
}
