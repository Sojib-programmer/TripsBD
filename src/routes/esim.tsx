import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Signal, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { inputClass } from "@/components/search/Sheet";
import { ChipBar, VerticalHeader } from "@/components/VerticalHeader";
import { supabase } from "@/integrations/supabase/client";
import { createEsimOrder, ESIM_COUNTRIES, listEsimPackages } from "@/lib/esim.functions";
import { bdt } from "@/lib/format";

export const Route = createFileRoute("/esim")({
  validateSearch: (s: Record<string, unknown>) => ({
    country:
      typeof s["country"] === "string" && /^[A-Z]{2}$/.test(s["country"]) ? s["country"] : "TH",
  }),
  component: EsimPage,
  head: () => ({
    meta: [
      { title: "Travel eSIM data plans — Trips.bd" },
      {
        name: "description",
        content:
          "Buy a travel data eSIM for Thailand, Malaysia, India, UAE and more. Pay in BDT with EPS and install by QR code in minutes.",
      },
      { property: "og:title", content: "Travel eSIM data plans — Trips.bd" },
      { property: "og:description", content: "Data eSIMs paid in BDT, installed by QR code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function EsimPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const listFn = useServerFn(listEsimPackages);
  const orderFn = useServerFn(createEsimOrder);
  const [picked, setPicked] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      const meta = data.session?.user.user_metadata as { full_name?: string } | undefined;
      if (meta?.full_name) setName(meta.full_name);
    });
  }, []);

  const plans = useQuery({
    queryKey: ["esim", search.country],
    queryFn: () => listFn({ data: { country: search.country } }),
    staleTime: 10 * 60 * 1000,
  });
  const country = ESIM_COUNTRIES.find((c) => c.code === search.country)?.name ?? search.country;
  const plan = plans.data?.plans.find((p) => p.code === picked) ?? null;

  const buy = useMutation({
    mutationFn: () =>
      orderFn({ data: { packageCode: picked!, contactName: name, contactPhone: phone } }),
    onSuccess: ({ reference }) => void navigate({ to: "/order/$reference", params: { reference } }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <VerticalHeader title={`${country} eSIM`} summary="Data only · install by QR code" />
      <ChipBar
        chips={ESIM_COUNTRIES.map((c) => ({ id: c.code, label: c.name }))}
        active={search.country}
        onSelect={(c) => {
          setPicked(null);
          void navigate({ to: "/esim", search: { country: c } });
        }}
      />

      <section className="space-y-3 px-5 py-4">
        <h1 className="text-[22px] font-bold text-foreground">Data plans for {country}</h1>
        {plans.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : plans.data?.error ? (
          <p role="alert" className="py-10 text-center text-[16px] text-muted-foreground">
            {plans.data.error}
          </p>
        ) : plans.data?.plans.length ? (
          plans.data.plans.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => setPicked(p.code)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
                picked === p.code ? "border-brand bg-brand/5" : "border-border"
              }`}
            >
              <Wifi className="shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-foreground">
                  {p.dataGb} GB · {p.days} days
                </p>
                <p className="flex items-center gap-1 truncate text-[14px] text-muted-foreground">
                  <Signal size={13} /> {p.operators.join(", ") || p.speed}
                </p>
              </div>
              <span className="text-[19px] font-bold text-foreground">{bdt(p.priceBdt)}</span>
            </button>
          ))
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            No plans for this country yet.
          </p>
        )}
      </section>

      {plan ? (
        <section className="space-y-3 border-t border-border px-5 py-4">
          <p className="text-[17px] font-semibold text-foreground">
            {country} · {plan.dataGb} GB · {plan.days} days — {bdt(plan.priceBdt)}
          </p>
          <p className="text-[14px] text-muted-foreground">
            Your phone must support eSIM and be carrier-unlocked. Validity starts when the eSIM
            first connects in {country}. Data only — no phone number.
          </p>
          {signedIn === false ? (
            <button
              type="button"
              onClick={() =>
                void navigate({ to: "/auth", search: { next: `/esim?country=${search.country}` } })
              }
              className="w-full rounded-full bg-brand py-3.5 text-[17px] font-semibold text-brand-foreground"
            >
              Sign in to buy
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                buy.mutate();
              }}
              className="space-y-3"
            >
              <input
                required
                minLength={2}
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                aria-label="Full name"
              />
              <input
                required
                type="tel"
                minLength={8}
                placeholder="Mobile number (for EPS checkout)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                aria-label="Mobile number"
              />
              <button
                type="submit"
                disabled={buy.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[17px] font-semibold text-brand-foreground disabled:opacity-60"
              >
                {buy.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                Continue to payment
              </button>
            </form>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}
