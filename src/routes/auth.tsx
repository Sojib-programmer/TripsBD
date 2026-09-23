import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Logo } from "@/components/Logo";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth";


const safeNext = (v: unknown) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    safeNext(s["next"]) ? { next: safeNext(s["next"]) } : {},
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Trips.bd" },
      {
        name: "description",
        content:
          "Sign in to Trips.bd with your email to sync bookings and unlock VIP member prices.",
      },
      { property: "og:title", content: "Sign in — Trips.bd" },
      { property: "og:description", content: "Sign in with your email address." },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const done = () => (next ? window.location.assign(next) : void navigate({ to: "/" }));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState<"email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending("email");
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        done();
      } else {
        await signUpWithEmail(email, password, fullName, next);
        setNotice("Account created. Check your inbox if email confirmation is required.");
        done();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(null);
    }
  };

  const busy = pending !== null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col bg-background px-6">
      <div className="pt-16">
        <Logo size="lg" />
        <h1 className="mt-8 font-display text-[30px] font-semibold tracking-tight text-foreground">
          {mode === "signin" ? "Sign in to Trips.bd" : "Create your Trips.bd account"}
        </h1>
        <p className="mt-2 text-[16px] text-muted-foreground">
          Sync your bookings across devices and unlock VIP member prices.
        </p>
      </div>

      <div className="mt-8" />

      <form onSubmit={submitEmail} className="space-y-3">
        {mode === "signup" ? (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Full name"
            className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-[16px] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
          />
        ) : null}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="Email address"
          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-[16px] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Password"
          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-[16px] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-[17px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending === "email" ? <Loader2 size={20} className="animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
        }}
        className="mt-4 text-center text-[15px] font-medium text-brand"
      >
        {mode === "signin"
          ? "New to Trips.bd? Create an account"
          : "Already have an account? Sign in"}
      </button>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[15px] text-foreground"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-4 rounded-xl border border-border bg-muted px-4 py-3 text-[15px] text-foreground">
          {notice}
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
