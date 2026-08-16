import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Apple, Loader2 } from "lucide-react";

import { Logo } from "@/components/Logo";
import { signInWith, type OAuthProvider } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Trips.bd" },
      {
        name: "description",
        content:
          "Sign in to Trips.bd with Google or Apple to sync bookings and unlock VIP member prices.",
      },
      { property: "og:title", content: "Sign in — Trips.bd" },
      { property: "og:description", content: "Sign in with Google or Apple." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function AuthPage() {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (provider: OAuthProvider) => {
    setError(null);
    setPending(provider);
    try {
      await signInWith(provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Please try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col bg-background px-6">
      <div className="pt-16">
        <Logo size="lg" />
        <h1 className="mt-8 font-display text-[30px] font-semibold tracking-tight text-foreground">
          Sign in to Trips.bd
        </h1>
        <p className="mt-2 text-[16px] text-muted-foreground">
          Sync your bookings across devices and unlock VIP member prices.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        <button
          onClick={() => void start("google")}
          disabled={pending !== null}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-card py-4 text-[17px] font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {pending === "google" ? <Loader2 size={20} className="animate-spin" /> : <GoogleGlyph />}
          Continue with Google
        </button>
        <button
          onClick={() => void start("apple")}
          disabled={pending !== null}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-foreground py-4 text-[17px] font-semibold text-background transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {pending === "apple" ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Apple size={20} fill="currentColor" />
          )}
          Continue with Apple
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[15px] text-foreground">
          {error}
        </p>
      ) : null}

      <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
        By continuing you agree to the Trips.bd Terms of Use and Privacy &amp; Cookie Policy.
      </p>

      <Link to="/" className="mt-auto py-10 text-center text-[16px] font-medium text-brand">
        Continue as guest
      </Link>
    </main>
  );
}
