import { supabase } from "@/integrations/supabase/client";

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string, fullName: string, next?: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}${next ?? "/"}`,
      data: { full_name: fullName },
    },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
