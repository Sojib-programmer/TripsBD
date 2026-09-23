import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = {
  data: {
    redirect_url?: string;
    redirect_to?: string;
    client?: { name?: string };
  } | null;
  error: { message: string } | null;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
    }
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  head: () => ({
    meta: [
      { title: "Connect an app — Trips.bd" },
      { name: "description", content: "Approve or deny an app's access to your Trips.bd account." },
      { property: "og:title", content: "Connect an app — Trips.bd" },
      { property: "og:description", content: "Approve or deny access to your Trips.bd account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-[440px] px-6 pt-16 text-foreground">
      Could not load this authorization request: {error.message}
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    const target = data?.redirect_url ?? data?.redirect_to;
    if (err || !target) {
      setBusy(false);
      setError(err?.message ?? "No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col bg-background px-6 pt-16">
      <Logo size="lg" />
      <h1 className="mt-8 font-display text-[26px] font-semibold text-foreground">
        Connect {name} to your Trips.bd account
      </h1>
      <p className="mt-2 text-[16px] text-muted-foreground">
        {name} will be able to search flights and submit booking requests as you. Requests are
        confirmed by our team, never charged automatically.
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-[14px] text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void decide(false)}
          className="flex-1 rounded-full border border-border py-3 text-[16px] font-semibold text-foreground"
        >
          Deny
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void decide(true)}
          className="flex-1 rounded-full bg-brand py-3 text-[16px] font-semibold text-brand-foreground"
        >
          Approve
        </button>
      </div>
    </main>
  );
}
